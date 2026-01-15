"""Async error handling and retry mechanisms for job application automation."""

import asyncio
import logging
import random
import json
import traceback
from typing import Dict, Any, Callable, Optional
from datetime import datetime
from enum import Enum
from pathlib import Path
import aiofiles

# Configure logging locally if not already configured
logger = logging.getLogger(__name__)

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
    def __init__(self, log_dir: str = "logs"):
        self.logger = logging.getLogger(__name__)
        self.log_file = Path(log_dir) / "error_log.json"
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
    
    async def log_error(self, error: Exception, context: Dict[str, Any], severity: ErrorSeverity = ErrorSeverity.MEDIUM) -> None:
        try:
            error_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "error_type": type(error).__name__,
                "error_message": str(error),
                "severity": severity.value,
                "context": context,
                "traceback": traceback.format_exception(type(error), error, error.__traceback__) if error.__traceback__ else None
            }
            
            # Log to standard logger
            level = {
                ErrorSeverity.LOW: logging.INFO,
                ErrorSeverity.MEDIUM: logging.WARNING,
                ErrorSeverity.HIGH: logging.ERROR,
                ErrorSeverity.CRITICAL: logging.CRITICAL
            }.get(severity, logging.WARNING)
            
            self.logger.log(level, f"{error_data['error_type']}: {error_data['error_message']}")
            await self._append_to_log_file(error_data)
        except Exception as e:
            self.logger.error(f"Failed to log error: {e}")

    async def _append_to_log_file(self, error_data: Dict[str, Any]) -> None:
        try:
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
        # Simplified Fibonacci for portability
        elif config.strategy == RetryStrategy.FIBONACCI_BACKOFF:
             if attempt <= 1: delay = config.base_delay
             else:
                 a, b = 1, 1
                 for _ in range(attempt - 1): a, b = b, a + b
                 delay = config.base_delay * b
        else:
            delay = config.base_delay
            
        delay = min(delay, config.max_delay)
        if config.jitter:
            delay = max(0, delay + (delay * config.jitter_range * (random.random() * 2 - 1)))
        return delay

    async def retry_with_backoff(
        self,
        func: Callable,
        *args,
        config: Optional[RetryConfig] = None,
        context: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Any:
        if config is None: config = self.default_config
        if context is None: context = {"function": getattr(func, '__name__', str(func))}
        
        last_exception = None
        func_name = getattr(func, '__name__', str(func))
        
        for attempt in range(config.max_attempts):
            try:
                if asyncio.iscoroutinefunction(func):
                    return await func(*args, **kwargs)
                else:
                    return func(*args, **kwargs)
            except NonRetryableError as e:
                await self.error_logger.log_error(e, {**context, "attempt": attempt + 1, "retryable": False}, e.severity)
                raise e
            except Exception as e:
                last_exception = e
                # Basic retryable check
                is_retryable = isinstance(e, RetryableError) or any(x in str(e).lower() for x in ["timeout", "connection", "network", "rate limit", "503"])
                
                severity = e.severity if hasattr(e, 'severity') else ErrorSeverity.MEDIUM
                await self.error_logger.log_error(e, {**context, "attempt": attempt + 1, "retryable": is_retryable}, severity)
                
                if not is_retryable:
                    raise e
                    
                if attempt < config.max_attempts - 1:
                    delay = self.calculate_delay(attempt, config)
                    self.logger.warning(f"{func_name} failed (attempt {attempt + 1}), retrying in {delay:.2f}s: {e}")
                    await asyncio.sleep(delay)
                else:
                    self.logger.error(f"{func_name} failed after {config.max_attempts} attempts")
        
        raise last_exception

# Fallback Strategy included here for self-containment
class FallbackStrategy:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.fallback_selectors = {
            "email": ['input[type="email"]', 'input[name="email"]', 'input[placeholder*="email"]'],
            "submit": ['button[type="submit"]', 'button:has-text("Submit")', 'button:has-text("Apply")']
        }

    async def find_element_with_fallback(self, page, primary_selector: str, element_type: str, timeout: int = 5000) -> Any:
        try:
            return await page.wait_for_selector(primary_selector, timeout=timeout)
        except:
            pass
        
        for selector in self.fallback_selectors.get(element_type, []):
            try:
                return await page.wait_for_selector(selector, timeout=1000)
            except: continue
        return None

retry_service = RetryService()
fallback_strategy = FallbackStrategy()
