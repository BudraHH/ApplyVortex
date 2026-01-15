"""Stealth Metrics and Monitoring - Production Grade Observability

Tracks:
- Session reuse efficiency
- Detection events (CAPTCHA, bans)
- Browser health metrics
- Ban rate calculation
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Optional
from dataclasses import dataclass, field
import asyncio

logger = logging.getLogger(__name__)


@dataclass
class SessionMetrics:
    """Metrics for a single browser session."""
    created_at: datetime = field(default_factory=datetime.now)
    operations_count: int = 0
    last_used: datetime = field(default_factory=datetime.now)
    health_checks_passed: int = 0
    health_checks_failed: int = 0
    detection_events: int = 0
    
    @property
    def age_minutes(self) -> float:
        """Session age in minutes."""
        return (datetime.now() - self.created_at).total_seconds() / 60
    
    @property
    def is_healthy(self) -> bool:
        """Check if session is healthy."""
        return self.health_checks_failed < 3 and self.detection_events < 2


class StealthMetrics:
    """Global stealth system metrics and monitoring."""
    
    def __init__(self):
        self.sessions_created = 0
        self.sessions_destroyed = 0
        self.context_reuses = 0
        self.total_operations = 0
        self.detection_events = 0
        self.captcha_encounters = 0
        self.ban_encounters = 0
        self.emergency_restarts = 0
        
        self.session_metrics: Dict[str, SessionMetrics] = {}
        self.start_time = datetime.now()
        
        # Performance tracking
        self.avg_operation_time = 0.0
        self.total_operation_time = 0.0
        
    def on_session_created(self, session_id: str):
        """Track new session creation."""
        self.sessions_created += 1
        self.session_metrics[session_id] = SessionMetrics()
        logger.info(f"📊 Session created: {session_id[:8]} (Total: {self.sessions_created})")
    
    def on_session_destroyed(self, session_id: str):
        """Track session destruction."""
        self.sessions_destroyed += 1
        if session_id in self.session_metrics:
            metrics = self.session_metrics[session_id]
            logger.info(
                f"📊 Session destroyed: {session_id[:8]} "
                f"(Age: {metrics.age_minutes:.1f}m, Ops: {metrics.operations_count})"
            )
            del self.session_metrics[session_id]
    
    def on_context_reuse(self, session_id: str):
        """Track context reuse (key efficiency metric)."""
        self.context_reuses += 1
        if session_id in self.session_metrics:
            self.session_metrics[session_id].operations_count += 1
            self.session_metrics[session_id].last_used = datetime.now()
        
        # Log milestone reuses
        if self.context_reuses % 10 == 0:
            logger.info(f"✅ Context reuse milestone: {self.context_reuses} reuses")
    
    def on_operation_complete(self, duration_seconds: float):
        """Track operation completion time."""
        self.total_operations += 1
        self.total_operation_time += duration_seconds
        self.avg_operation_time = self.total_operation_time / self.total_operations
    
    def on_health_check(self, session_id: str, passed: bool):
        """Track health check results."""
        if session_id in self.session_metrics:
            if passed:
                self.session_metrics[session_id].health_checks_passed += 1
            else:
                self.session_metrics[session_id].health_checks_failed += 1
                logger.warning(f"⚠️ Health check failed for session {session_id[:8]}")
    
    def on_captcha(self, session_id: Optional[str] = None):
        """Track CAPTCHA encounter."""
        self.captcha_encounters += 1
        self.detection_events += 1
        
        if session_id and session_id in self.session_metrics:
            self.session_metrics[session_id].detection_events += 1
        
        logger.error(f"🚨 CAPTCHA encountered! Total: {self.captcha_encounters}")
    
    def on_ban(self, session_id: Optional[str] = None):
        """Track ban/block encounter."""
        self.ban_encounters += 1
        self.detection_events += 1
        
        if session_id and session_id in self.session_metrics:
            self.session_metrics[session_id].detection_events += 1
        
        logger.critical(f"🚨 BAN detected! Total: {self.ban_encounters}")
    
    def on_emergency_restart(self):
        """Track emergency browser restart."""
        self.emergency_restarts += 1
        logger.critical(f"🔄 Emergency restart #{self.emergency_restarts}")
    
    @property
    def ban_rate(self) -> float:
        """Calculate ban rate (bans per 100 operations)."""
        if self.total_operations == 0:
            return 0.0
        return (self.ban_encounters / self.total_operations) * 100
    
    @property
    def detection_rate(self) -> float:
        """Calculate overall detection rate (%)."""
        if self.total_operations == 0:
            return 0.0
        return (self.detection_events / self.total_operations) * 100
    
    @property
    def reuse_efficiency(self) -> float:
        """Calculate context reuse efficiency (%)."""
        total_uses = self.sessions_created + self.context_reuses
        if total_uses == 0:
            return 0.0
        return (self.context_reuses / total_uses) * 100
    
    @property
    def uptime_hours(self) -> float:
        """System uptime in hours."""
        return (datetime.now() - self.start_time).total_seconds() / 3600
    
    def get_summary(self) -> Dict:
        """Get comprehensive metrics summary."""
        return {
            "uptime_hours": round(self.uptime_hours, 2),
            "sessions_created": self.sessions_created,
            "sessions_active": len(self.session_metrics),
            "context_reuses": self.context_reuses,
            "reuse_efficiency": round(self.reuse_efficiency, 2),
            "total_operations": self.total_operations,
            "avg_operation_time": round(self.avg_operation_time, 2),
            "detection_events": self.detection_events,
            "captcha_encounters": self.captcha_encounters,
            "ban_encounters": self.ban_encounters,
            "ban_rate": round(self.ban_rate, 4),
            "detection_rate": round(self.detection_rate, 4),
            "emergency_restarts": self.emergency_restarts
        }
    
    def log_summary(self):
        """Log metrics summary."""
        summary = self.get_summary()
        logger.info("=" * 60)
        logger.info("📊 STEALTH METRICS SUMMARY")
        logger.info("=" * 60)
        for key, value in summary.items():
            logger.info(f"  {key}: {value}")
        logger.info("=" * 60)


class CircuitBreaker:
    """Circuit breaker pattern for failure protection.
    
    States:
    - CLOSED: Normal operation
    - OPEN: Too many failures, reject requests
    - HALF_OPEN: Testing if system recovered
    """
    
    def __init__(self, 
                 failure_threshold: int = 5,
                 recovery_timeout: int = 300,
                 success_threshold: int = 2):
        """
        Args:
            failure_threshold: Failures before opening circuit
            recovery_timeout: Seconds to wait before half-open
            success_threshold: Successes needed to close from half-open
        """
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.success_threshold = success_threshold
        
        self.state = "CLOSED"
        self.failures = 0
        self.successes = 0
        self.last_failure_time: Optional[datetime] = None
        
        self.logger = logging.getLogger(__name__)
    
    async def call(self, func, *args, **kwargs):
        """Execute function with circuit breaker protection.
        
        Args:
            func: Async function to execute
            *args, **kwargs: Function arguments
            
        Returns:
            Function result
            
        Raises:
            Exception: If circuit is OPEN or function fails
        """
        # Check if we should transition from OPEN to HALF_OPEN
        if self.state == "OPEN":
            if self.last_failure_time:
                elapsed = (datetime.now() - self.last_failure_time).total_seconds()
                if elapsed >= self.recovery_timeout:
                    self.logger.info("🔄 Circuit breaker: OPEN → HALF_OPEN (testing recovery)")
                    self.state = "HALF_OPEN"
                    self.successes = 0
                else:
                    remaining = self.recovery_timeout - elapsed
                    self.logger.warning(
                        f"⛔ Circuit breaker OPEN - retry in {remaining:.0f}s"
                    )
                    raise Exception(f"Circuit breaker OPEN - retry in {remaining:.0f}s")
        
        # Attempt operation
        try:
            result = await func(*args, **kwargs)
            
            # Success handling
            self.failures = 0
            
            if self.state == "HALF_OPEN":
                self.successes += 1
                if self.successes >= self.success_threshold:
                    self.logger.info("✅ Circuit breaker: HALF_OPEN → CLOSED (recovered)")
                    self.state = "CLOSED"
                    self.successes = 0
            
            return result
            
        except Exception as e:
            # Failure handling
            self.failures += 1
            self.last_failure_time = datetime.now()
            
            if self.state == "HALF_OPEN":
                self.logger.warning("⚠️ Circuit breaker: HALF_OPEN → OPEN (recovery failed)")
                self.state = "OPEN"
                self.successes = 0
            elif self.failures >= self.failure_threshold:
                self.logger.error(
                    f"🚨 Circuit breaker: CLOSED → OPEN "
                    f"({self.failures} consecutive failures)"
                )
                self.state = "OPEN"
            
            raise e
    
    def reset(self):
        """Manually reset circuit breaker."""
        self.logger.info("🔄 Circuit breaker manually reset")
        self.state = "CLOSED"
        self.failures = 0
        self.successes = 0
        self.last_failure_time = None


# Global metrics instance
stealth_metrics = StealthMetrics()
