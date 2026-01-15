"""Browser Automation Service - rtrvr.ai Grade Stealth System

Features:
- Persistent session pool (3 contexts max)
- Sticky fingerprinting (consistent UA across sessions)
- Health checks and auto-recovery
- Circuit breaker protection
- Human simulation integration
- Zero browser restarts during normal operation
"""

import asyncio
import logging
import hashlib
import uuid
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from pathlib import Path
import json

from playwright.async_api import async_playwright, Browser, BrowserContext, Page, Playwright
from playwright.async_api import TimeoutError as PlaywrightTimeoutError

# Local imports
from .retry_service import (
    retry_service, 
    fallback_strategy,
    RetryConfig, 
    RetryStrategy,
    BrowserError,
    NavigationError,
    FormError,
    NetworkError,
    PortalChangeError,
    ErrorSeverity
)
from agent.core.state_manager import state_manager
from agent.core.human_simulator import HumanSimulator
from agent.core.metrics import stealth_metrics, CircuitBreaker

logger = logging.getLogger(__name__)


class BrowserAutomationError(Exception): pass
class FormDetectionError(BrowserAutomationError): pass
class FileUploadError(BrowserAutomationError): pass


class StickyFingerprint:
    """Manages consistent browser fingerprint across sessions."""
    
    def __init__(self):
        self.fingerprint = self._generate()
        self._save_to_disk()
    
    def _generate(self) -> Dict:
        """Generate or load sticky fingerprint."""
        fingerprint_path = Path(state_manager.storage_path) / "fingerprint.json"
        
        # Load existing fingerprint if available
        if fingerprint_path.exists():
            try:
                with open(fingerprint_path, 'r') as f:
                    loaded = json.load(f)
                    logger.info("📌 Loaded existing fingerprint from disk")
                    return loaded
            except Exception as e:
                logger.warning(f"Failed to load fingerprint: {e}, generating new one")
        
        # Generate new fingerprint
        fingerprint = {
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'viewport': {'width': 1920, 'height': 1080},
            'screen': {'width': 1920, 'height': 1080},
            'timezone': 'Asia/Kolkata',
            'locale': 'en-IN,en;q=0.9',
            'geolocation': {'latitude': 12.9716, 'longitude': 77.5946},  # Bangalore
            'color_depth': 24,
            'device_scale_factor': 1,
            'has_touch': False,
            'created_at': datetime.now().isoformat()
        }
        
        logger.info("🆕 Generated new sticky fingerprint")
        return fingerprint
    
    def _save_to_disk(self):
        """Persist fingerprint to disk."""
        try:
            fingerprint_path = Path(state_manager.storage_path) / "fingerprint.json"
            fingerprint_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(fingerprint_path, 'w') as f:
                json.dump(self.fingerprint, f, indent=2)
            
            logger.debug("💾 Fingerprint saved to disk")
        except Exception as e:
            logger.error(f"Failed to save fingerprint: {e}")
    
    def get_context_options(self, storage_state: Optional[str] = None) -> Dict:
        """Get Playwright context options with sticky fingerprint."""
        opts = {
            'viewport': self.fingerprint['viewport'],
            'user_agent': self.fingerprint['user_agent'],
            'locale': self.fingerprint['locale'],
            'timezone_id': self.fingerprint['timezone'],
            'geolocation': self.fingerprint['geolocation'],
            'permissions': ['geolocation'],
            'device_scale_factor': self.fingerprint['device_scale_factor'],
            'has_touch': self.fingerprint['has_touch'],
            'color_scheme': 'dark',
            'reduced_motion': 'no-preference'
        }
        
        if storage_state and Path(storage_state).exists():
            logger.info(f"🔐 Loading session from: {storage_state}")
            opts['storage_state'] = storage_state
        
        return opts


class SessionPool:
    """Manages pool of reusable browser contexts."""
    
    def __init__(self, max_size: int = 3):
        self.max_size = max_size
        self.pool: List[Tuple[str, BrowserContext, datetime]] = []  # (id, context, created_at)
        self.in_use: Dict[str, BrowserContext] = {}
        self.logger = logging.getLogger(__name__)
    
    def get_context(self) -> Optional[Tuple[str, BrowserContext]]:
        """Get context from pool (round-robin)."""
        if not self.pool:
            return None
        
        # Get oldest context (FIFO)
        session_id, context, created_at = self.pool.pop(0)
        self.in_use[session_id] = context
        
        stealth_metrics.on_context_reuse(session_id)
        self.logger.debug(f"♻️ Reusing context: {session_id[:8]}")
        
        return session_id, context
    
    def return_context(self, session_id: str, context: BrowserContext):
        """Return context to pool."""
        if session_id in self.in_use:
            del self.in_use[session_id]
        
        # Only return to pool if under max size
        if len(self.pool) < self.max_size:
            self.pool.append((session_id, context, datetime.now()))
            self.logger.debug(f"↩️ Returned context to pool: {session_id[:8]}")
        else:
            # Pool full, close context
            asyncio.create_task(self._close_context(session_id, context))
    
    async def _close_context(self, session_id: str, context: BrowserContext):
        """Close context and cleanup."""
        try:
            await context.close()
            stealth_metrics.on_session_destroyed(session_id)
            self.logger.debug(f"🗑️ Closed excess context: {session_id[:8]}")
        except Exception as e:
            self.logger.warning(f"Failed to close context {session_id[:8]}: {e}")
    
    async def clear(self):
        """Clear entire pool."""
        for session_id, context, _ in self.pool:
            await self._close_context(session_id, context)
        
        for session_id, context in self.in_use.items():
            await self._close_context(session_id, context)
        
        self.pool.clear()
        self.in_use.clear()
        self.logger.info("🧹 Session pool cleared")
    
    def get_stats(self) -> Dict:
        """Get pool statistics."""
        return {
            'pool_size': len(self.pool),
            'in_use': len(self.in_use),
            'max_size': self.max_size
        }


class BrowserManager:
    """Manages browser lifecycle with persistent sessions."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.playwright: Optional[Playwright] = None
        self.browser: Optional[Browser] = None
        self.fingerprint = StickyFingerprint()
        self.session_pool = SessionPool(max_size=3)
        self.circuit_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=300)
        self._initialized = False
        self._last_health_check = datetime.now()
    
    async def start(self, headless: bool = True, browser_type: str = "chromium") -> None:
        """Start browser (once per agent lifetime)."""
        if self._initialized:
            self.logger.debug("Browser already initialized")
            return
        
        try:
            # Try stealth mode first
            if browser_type == "chromium":
                try:
                    import undetected_playwright as upw
                    self.logger.info(f"🚀 Starting Stealth Browser (headless={headless})...")
                    self.playwright = await upw.init()
                    self.browser = await self.playwright.chromium.launch(
                        headless=headless,
                        args=[
                            '--disable-blink-features=AutomationControlled',
                            '--no-first-run',
                            '--disable-infobars',
                            '--window-size=1920,1080',
                            '--disable-dev-shm-usage',
                            '--no-sandbox'
                        ]
                    )
                    self.logger.info("✅ Stealth Browser launched successfully")
                    self._initialized = True
                    return
                except Exception as e:
                    self.logger.warning(f"Stealth launch failed: {e}. Falling back to standard Playwright.")

            # Standard fallback
            self.playwright = await async_playwright().start()
            if browser_type == "firefox":
                self.browser = await self.playwright.firefox.launch(headless=headless)
            elif browser_type == "webkit":
                self.browser = await self.playwright.webkit.launch(headless=headless)
            else:
                self.browser = await self.playwright.chromium.launch(
                    headless=headless, 
                    args=[
                        '--no-sandbox', 
                        '--disable-dev-shm-usage',
                        '--disable-blink-features=AutomationControlled',
                        '--disable-infobars',
                        '--start-maximized'
                    ],
                    ignore_default_args=["--enable-automation"]
                )
            
            self.logger.info(f"✅ Standard Browser started: {browser_type} (headless: {headless})")
            self._initialized = True
            
        except Exception as e:
            self.logger.error(f"Failed to start browser: {e}")
            raise BrowserAutomationError(f"Browser startup failed: {e}")
    
    async def create_context(self) -> Tuple[str, BrowserContext]:
        """Create new browser context with sticky fingerprint."""
        if not self.browser:
            raise BrowserAutomationError("Browser not started")
        
        try:
            # Generate unique session ID
            session_id = str(uuid.uuid4())
            
            # Get context options with sticky fingerprint
            session_path = state_manager.get_session_path()
            opts = self.fingerprint.get_context_options(storage_state=session_path)
            
            # Create context
            context = await self.browser.new_context(**opts)
            
            # Track metrics
            stealth_metrics.on_session_created(session_id)
            
            self.logger.info(f"🆕 Created new context: {session_id[:8]}")
            return session_id, context
            
        except Exception as e:
            self.logger.error(f"Failed to create context: {e}")
            raise BrowserAutomationError(f"Context creation failed: {e}")
    
    async def health_check(self, context: BrowserContext, session_id: str) -> bool:
        """Check if context is healthy."""
        try:
            page = await context.new_page()
            
            # Quick navigation test
            await page.goto("https://www.google.com", timeout=10000, wait_until='domcontentloaded')
            
            # Check if page loaded
            title = await page.title()
            await page.close()
            
            if title:
                stealth_metrics.on_health_check(session_id, passed=True)
                self.logger.debug(f"✅ Health check passed: {session_id[:8]}")
                return True
            
            stealth_metrics.on_health_check(session_id, passed=False)
            return False
            
        except Exception as e:
            self.logger.warning(f"Health check failed for {session_id[:8]}: {e}")
            stealth_metrics.on_health_check(session_id, passed=False)
            return False
    
    async def stop(self) -> None:
        """Stop browser and cleanup."""
        await self.session_pool.clear()
        
        if self.browser:
            await self.browser.close()
            self.browser = None
        
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None
        
        self._initialized = False
        self.logger.info("🛑 Browser stopped")


class BrowserService:
    """Main browser service with session pooling and stealth features."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.browser_manager = BrowserManager()
        self._initialized = False
        self._headless = True
    
    async def initialize(self, headless: bool = True) -> None:
        """Initialize browser service."""
        if self._initialized:
            return
        
        self._headless = headless
        await self.browser_manager.start(headless=headless)
        self._initialized = True
        self.logger.info("🎯 Browser service initialized")
    
    async def get_page(self) -> Tuple[str, BrowserContext, Page]:
        """Get page from pool (main entry point for scrapers).
        
        Returns:
            (session_id, context, page) tuple
        """
        if not self._initialized:
            await self.initialize(headless=self._headless)
        
        # Try to get from pool first
        pool_result = self.browser_manager.session_pool.get_context()
        
        if pool_result:
            session_id, context = pool_result
            
            # Health check every 30 minutes
            time_since_check = datetime.now() - self.browser_manager._last_health_check
            if time_since_check > timedelta(minutes=30):
                is_healthy = await self.browser_manager.health_check(context, session_id)
                self.browser_manager._last_health_check = datetime.now()
                
                if not is_healthy:
                    self.logger.warning(f"⚠️ Unhealthy context detected, creating new one")
                    await context.close()
                    session_id, context = await self.browser_manager.create_context()
        else:
            # Create new context
            session_id, context = await self.browser_manager.create_context()
        
        # Create new page
        page = await context.new_page()
        
        # Apply stealth plugin
        try:
            from playwright_stealth import stealth_async
            await stealth_async(page)
        except Exception:
            pass
        
        self.logger.debug(f"📄 Page ready: {session_id[:8]}")
        return session_id, context, page
    
    async def return_page(self, session_id: str, context: BrowserContext, page: Page):
        """Return page to pool (MUST be called after use)."""
        try:
            # Close page
            await page.close()
            
            # Save session state
            await self.save_session(context)
            
            # Return context to pool
            self.browser_manager.session_pool.return_context(session_id, context)
            
            self.logger.debug(f"↩️ Page returned: {session_id[:8]}")
            
        except Exception as e:
            self.logger.error(f"Failed to return page: {e}")
    
    async def save_session(self, context: BrowserContext) -> None:
        """Save session state (cookies/storage) to disk."""
        try:
            session_path = state_manager.get_session_path()
            await context.storage_state(path=session_path)
            self.logger.debug(f"💾 Session saved to {session_path}")
        except Exception as e:
            self.logger.error(f"Failed to save session: {e}")
    
    async def cleanup(self) -> None:
        """Emergency cleanup (panic stop)."""
        await self.browser_manager.stop()
        self._initialized = False
        self.logger.warning("🚨 Emergency cleanup completed")
    
    async def emergency_restart(self) -> None:
        """Emergency restart after detection events."""
        stealth_metrics.on_emergency_restart()
        self.logger.critical("🔄 EMERGENCY RESTART initiated")
        
        await self.cleanup()
        await asyncio.sleep(5)  # Cooldown
        await self.initialize(headless=self._headless)
        
        self.logger.info("✅ Emergency restart completed")
    
    # Legacy compatibility methods
    async def create_session(self) -> Tuple[BrowserContext, Page]:
        """Legacy method - use get_page() instead."""
        session_id, context, page = await self.get_page()
        return context, page
    
    async def navigate_to_job(self, page: Page, job_url: str) -> bool:
        """Navigate to job URL with retry."""
        async def _navigate():
            self.logger.info(f"🔗 Navigating to: {job_url}")
            await page.goto(job_url, timeout=60000, wait_until='domcontentloaded')
            await page.wait_for_load_state('networkidle', timeout=30000)
            return True
        
        return await retry_service.retry_with_backoff(_navigate, context={"job_url": job_url})
    
    async def take_screenshot(self, page: Page, name: str) -> str:
        """Take screenshot for debugging."""
        try:
            path = Path("screenshots") / f"{name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.png"
            path.parent.mkdir(parents=True, exist_ok=True)
            await page.screenshot(path=str(path), full_page=True)
            return str(path)
        except Exception:
            return ""
    
    async def launch_interactive_session(self, url: str, success_url_regex: Optional[str] = None) -> bool:
        """Launch headed browser for manual login."""
        import re
        
        self.logger.info(f"🔑 Launching interactive session for: {url}")
        
        # Ensure browser is started in HEADED mode
        if self._initialized:
            await self.cleanup()
        
        await self.browser_manager.start(headless=False)
        self._initialized = True

        session_id, context = await self.browser_manager.create_context()
        page = await context.new_page()
        
        # Apply stealth
        try:
            from playwright_stealth import stealth_async
            await stealth_async(page)
        except Exception:
            pass
        
        try:
            await page.goto(url)
            self.logger.info("⏳ Waiting for user to complete login...")
            
            # Monitor URL if regex provided
            monitoring_task = None
            if success_url_regex:
                async def monitor_url():
                    try:
                        pattern = re.compile(success_url_regex)
                        while not page.is_closed():
                            if pattern.search(page.url):
                                self.logger.info("✅ Login success detected! Auto-closing in 5s...")
                                try:
                                    await page.evaluate("alert('Login Successful! Closing window in 5 seconds...');")
                                except:
                                    pass
                                
                                await asyncio.sleep(5)
                                if not page.is_closed():
                                    await page.close()
                                break
                            await asyncio.sleep(0.5)
                    except Exception as e:
                        self.logger.error(f"URL monitoring failed: {e}")

                monitoring_task = asyncio.create_task(monitor_url())
            
            # Wait for page close
            try:
                await page.wait_for_event("close", timeout=0)
            except Exception:
                pass

            # Cleanup monitoring
            if monitoring_task:
                monitoring_task.cancel()
                try:
                    await monitoring_task
                except asyncio.CancelledError:
                    pass

            self.logger.info("💾 Saving session...")
            await self.save_session(context)
            return True

        except Exception as e:
            self.logger.error(f"Interactive session error: {e}")
            return False
        finally:
            await self.cleanup()


# Global service instance
browser_service = BrowserService()
