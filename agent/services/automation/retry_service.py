"""Async error handling and retry mechanisms for job application automation."""

import asyncio
import logging
import random
import json
from typing import Dict, List, Optional, Any, Callable, Union
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path

from app.core.config import settings


class RetryStrategy(str, Enum):
    """Retry strategy types."""
    EXPONENTIAL_BACKOFF = "exponential_backoff"
    LINEAR_BACKOFF = "linear_backoff"
    FIXED_DELAY = "fixed_delay"
    FIBONACCI_BACKOFF = "fibonacci_backoff"


class ErrorSeverity(str, Enum):
    """Error severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RetryableError(Exception):
    """Base class for retryable errors."""
    def __init__(self, message: str, severity: ErrorSeverity = ErrorSeverity.MEDIUM, retry_after: Optional[float] = None):
        super().__init__(message)
        self.severity = severity
        self.retry_after = retry_after
        self.timestamp = datetime.utcnow()


class NonRetryableError(Exception):
    """Base class for non-retryable errors."""
    def __init__(self, message: str, severity: ErrorSeverity = ErrorSeverity.HIGH):
        super().__init__(message)
        self.severity = severity
        self.timestamp = datetime.utcnow()


class BrowserError(RetryableError): pass
class NavigationError(RetryableError): pass
class FormError(RetryableError): pass
class NetworkError(RetryableError): pass
class PortalChangeError(RetryableError): pass


class RetryConfig:
    """Configuration for retry behavior."""
    def __init__(
        self,
        max_attempts: int = 3,
        strategy: RetryStrategy = RetryStrategy.EXPONENTIAL_BACKOFF,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        backoff_multiplier: float = 2.0,
        jitter: bool = True,
        jitter_range: float = 0.1
    ):
        self.max_attempts = max_attempts
        self.strategy = strategy
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.backoff_multiplier = backoff_multiplier
        self.jitter = jitter
        self.jitter_range = jitter_range


class ErrorLogger:
    """Structured error logging system."""
    def __init__(self, log_file: Optional[str] = None):
        self.logger = logging.getLogger(__name__)
        # Modified to use app root or a defined logs dir
        self.log_file = Path(log_file) if log_file else Path("logs/error_log.json")
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
    
    async def log_error(self, error: Exception, context: Dict[str, Any], severity: ErrorSeverity = ErrorSeverity.MEDIUM) -> None:
        try:
            error_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "error_type": type(error).__name__,
                "error_message": str(error),
                "severity": severity.value,
                "context": context,
            }
            if hasattr(error, '__traceback__') and error.__traceback__:
                import traceback
                error_data["traceback"] = "".join(traceback.format_exception(type(error), error, error.__traceback__))
            
            log_level = {
                ErrorSeverity.LOW: logging.INFO,
                ErrorSeverity.MEDIUM: logging.WARNING,
                ErrorSeverity.HIGH: logging.ERROR,
                ErrorSeverity.CRITICAL: logging.CRITICAL
            }.get(severity, logging.WARNING)
            
            self.logger.log(log_level, f"{error_data['error_type']}: {error_data['error_message']}")
            await self._append_to_log_file(error_data)
        except Exception as e:
            self.logger.error(f"Failed to log error: {e}")
    
    async def _append_to_log_file(self, error_data: Dict[str, Any]) -> None:
        try:
            import aiofiles
            log_entries = []
            if self.log_file.exists():
                async with aiofiles.open(self.log_file, 'r') as f:
                    content = await f.read()
                    if content.strip():
                        log_entries = json.loads(content)
            
            log_entries.append(error_data)
            if len(log_entries) > 1000:
                log_entries = log_entries[-1000:]
            
            async with aiofiles.open(self.log_file, 'w') as f:
                await f.write(json.dumps(log_entries, indent=2))
        except Exception as e:
            self.logger.error(f"Failed to write to log file: {e}")


class RetryService:
    """Service for handling retries with exponential backoff and error handling."""
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.error_logger = ErrorLogger()
        self.default_config = RetryConfig()
    
    def calculate_delay(self, attempt: int, config: RetryConfig) -> float:
        if config.strategy == RetryStrategy.EXPONENTIAL_BACKOFF:
            delay = config.base_delay * (config.backoff_multiplier ** attempt)
        elif config.strategy == RetryStrategy.LINEAR_BACKOFF:
            delay = config.base_delay * (attempt + 1)
        else:
            delay = config.base_delay
        
        delay = min(delay, config.max_delay)
        if config.jitter:
            jitter_amount = delay * config.jitter_range * (random.random() * 2 - 1)
            delay = max(0, delay + jitter_amount)
        return delay
    
    async def retry_with_backoff(
        self, func: Callable, *args, config: Optional[RetryConfig] = None, context: Optional[Dict[str, Any]] = None, **kwargs
    ) -> Any:
        if config is None: config = self.default_config
        if context is None: context = {"function": func.__name__ if hasattr(func, '__name__') else str(func)}
        
        last_exception = None
        func_name = getattr(func, '__name__', str(func))
        
        for attempt in range(config.max_attempts):
            try:
                self.logger.info(f"Executing {func_name} (attempt {attempt + 1}/{config.max_attempts})")
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = func(*args, **kwargs)
                return result
            except NonRetryableError as e:
                await self.error_logger.log_error(e, {**context, "attempt": attempt + 1, "retryable": False}, e.severity)
                raise e
            except Exception as e:
                last_exception = e
                is_retryable = self._is_retryable_error(e)
                severity = self._determine_error_severity(e)
                await self.error_logger.log_error(e, {**context, "attempt": attempt + 1, "retryable": is_retryable}, severity)
                
                if not is_retryable or attempt >= config.max_attempts - 1:
                    raise e
                
                delay = self.calculate_delay(attempt, config)
                self.logger.warning(f"{func_name} failed (attempt {attempt + 1}), retrying in {delay:.2f}s: {e}")
                await asyncio.sleep(delay)
        raise last_exception
    
    def _is_retryable_error(self, error: Exception) -> bool:
        if isinstance(error, RetryableError): return True
        if isinstance(error, NonRetryableError): return False
        
        retryable_patterns = ["timeout", "connection", "network", "temporary", "rate limit", "503", "502", "504"]
        error_message = str(error).lower()
        return any(pattern in error_message for pattern in retryable_patterns)
    
    def _determine_error_severity(self, error: Exception) -> ErrorSeverity:
        if hasattr(error, 'severity'): return error.severity
        error_message = str(error).lower()
        if any(p in error_message for p in ["critical", "fatal", "crash"]): return ErrorSeverity.CRITICAL
        if any(p in error_message for p in ["auth", "permission"]): return ErrorSeverity.HIGH
        return ErrorSeverity.MEDIUM

# Global service instance
retry_service = RetryService()
