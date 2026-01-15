import logging
import asyncio
import tempfile
import random
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple

from playwright.async_api import async_playwright, Browser, BrowserContext, Page, TimeoutError as PlaywrightTimeoutError

from app.core.config import settings
from app.services.automation.retry_service import retry_service, RetryConfig, RetryStrategy, BrowserError, NavigationError, FormError, NetworkError

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
]

class BrowserAutomationError(Exception):
    """Base exception for browser automation errors."""
    pass


class FileUploadError(BrowserAutomationError):
    """Exception raised when file upload fails."""
    pass


class BrowserManager:
    """Manager for handling Playwright browser instances and contexts."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.playwright = None
        self.browser = None
        self.contexts: List[BrowserContext] = []
    
    async def start(self, headless: bool = True, browser_type: str = "chromium") -> None:
        try:
            self.playwright = await async_playwright().start()
            
            # Anti-detection arguments for Chromium
            args = [
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-infobars",
                "--window-position=0,0",
                "--ignore-certificate-errors",
                "--ignore-ssl-errors",
                "--disable-dev-shm-usage"
            ]

            if browser_type == "chromium":
                self.browser = await self.playwright.chromium.launch(
                    headless=headless,
                    args=args
                )
            elif browser_type == "firefox":
                self.browser = await self.playwright.firefox.launch(headless=headless)
            else:
                self.browser = await self.playwright.webkit.launch(headless=headless)
            self.logger.info(f"Started {browser_type} browser (headless={headless})")
        except Exception as e:
            self.logger.error(f"Failed to start browser: {e}")
            raise BrowserError(f"Failed to start browser: {e}")
    
    async def stop(self) -> None:
        for context in self.contexts:
            await context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
        self.logger.info("Stopped browser and Playwright")
    
    async def create_context(self, user_agent: Optional[str] = None, viewport: Optional[Dict[str, int]] = None) -> BrowserContext:
        if not self.browser:
            await self.start()
        
        ua = user_agent or random.choice(USER_AGENTS)
        vp = viewport or {'width': random.randint(1366, 1920), 'height': random.randint(768, 1080)}
        
        context = await self.browser.new_context(
            user_agent=ua,
            viewport=vp,
            locale="en-US",
            timezone_id="Asia/Kolkata", # Align with user location
            geolocation={"latitude": 12.9716, "longitude": 77.5946}, # Example: Bangalore
            permissions=["geolocation"]
        )
        
        # Inject script to remove webdriver property
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        """)
        
        self.contexts.append(context)
        return context


class FormFieldMapper:
    """Utility for detecting and mapping job application form fields."""
    
    SELECTORS = {
        "first_name": ['input[name*="first" i]', 'input[id*="first" i]', 'input[autocomplete*="given-name"]', 'input[placeholder*="First Name" i]'],
        "last_name": ['input[name*="last" i]', 'input[id*="last" i]', 'input[autocomplete*="family-name"]', 'input[placeholder*="Last Name" i]'],
        "full_name": ['input[name*="fullname" i]', 'input[name="name" i]', 'input[id*="name" i]', 'input[autocomplete*="name"]', 'input[placeholder*="Full Name" i]'],
        "email": ['input[type="email"]', 'input[name*="email" i]', 'input[id*="email" i]', 'input[placeholder*="Email" i]'],
        "phone": ['input[type="tel"]', 'input[name*="phone" i]', 'input[id*="phone" i]', 'input[placeholder*="Phone" i]'],
        "resume_upload": ['input[type="file"]', 'input[name*="resume" i]', 'input[id*="resume" i]', 'input[id*="file" i]', 'input[accept*="pdf" i]'],
        "portfolio_url": ['input[name*="portfolio" i]', 'input[name*="website" i]', 'input[id*="portfolio" i]', 'input[placeholder*="Portfolio" i]', 'input[placeholder*="Website" i]'],
        "linkedin_url": ['input[name*="linkedin" i]', 'input[id*="linkedin" i]', 'input[placeholder*="LinkedIn" i]'],
        "submit": ['button[type="submit"]', 'input[type="submit"]', 'button:has-text("Submit")', 'button:has-text("Apply")', 'button:has-text("Next")', 'button:has-text("Continue")']
    }
    
    @classmethod
    async def get_form_context(cls, page: Page) -> List[Dict[str, Any]]:
        """Extracts all visible input fields with their associated labels/context."""
        fields = []
        inputs = await page.query_selector_all('input, textarea, select')
        for el in inputs:
            try:
                if not await el.is_visible(): continue
                
                # Try to find associated label
                id_attr = await el.get_attribute("id")
                label_text = ""
                if id_attr:
                    label_el = await page.query_selector(f'label[for="{id_attr}"]')
                    if label_el:
                        label_text = await label_el.inner_text()
                
                if not label_text:
                    # Look for preceding text or parent container text
                    label_text = await page.evaluate('(el) => { \
                        const parent = el.closest("div, section"); \
                        return parent ? parent.innerText.split("\\n")[0] : ""; \
                    }', el)

                fields.append({
                    "tag": await page.evaluate('(el) => el.tagName.toLowerCase()', el),
                    "type": await el.get_attribute("type") or "text",
                    "name": await el.get_attribute("name") or "",
                    "id": id_attr or "",
                    "placeholder": await el.get_attribute("placeholder") or "",
                    "label": label_text.strip(),
                    "element": el
                })
            except:
                continue
        return fields


class FileUploadHandler:
    """Handler for managing file uploads during browser automation."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)

    async def upload_file(self, page: Page, selector: str, file_path: str, timeout: int = 30000) -> bool:
        file_path_obj = Path(file_path)
        if not file_path_obj.exists():
            raise FileUploadError(f"File not found: {file_path}")
            
        async def _upload():
            try:
                file_input = await page.wait_for_selector(selector, timeout=timeout)
                if not file_input: raise FileUploadError(f"File input not found: {selector}")
                await file_input.set_input_files(str(file_path_obj))
                return True
            except Exception as e:
                self.logger.error(f"File upload failed: {e}")
                raise FileUploadError(f"File upload failed: {e}")
        
        return await retry_service.retry_with_backoff(_upload)


class BrowserAutomationService:
    """Main service for browser automation with Playwright."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.browser_manager = BrowserManager()
        self.file_upload_handler = FileUploadHandler()
        self._initialized = False
    
    async def initialize(self, headless: bool = True) -> None:
        if self._initialized: return
        await self.browser_manager.start(headless=headless)
        self._initialized = True
    
    async def create_session(self) -> Tuple[BrowserContext, Page]:
        if not self._initialized: await self.initialize()
        context = await self.browser_manager.create_context()
        page = await context.new_page()
        page.set_default_timeout(30000)
        return context, page
    
    async def navigate_to_job(self, page: Page, job_url: str) -> bool:
        async def _navigate():
            self.logger.info(f"Navigating to job: {job_url}")
            response = await page.goto(job_url, timeout=60000)
            if not response or response.status >= 400:
                raise NavigationError(f"Navigation failed: {response.status if response else 'No Response'}")
            await page.wait_for_load_state('networkidle', timeout=30000)
            return True
        return await retry_service.retry_with_backoff(_navigate)

    async def type_slowly(self, page: Page, selector: str, text: str, delay_range: Tuple[float, float] = (0.05, 0.15)):
        """Simulate human typing with random delays."""
        element = await page.wait_for_selector(selector)
        if not element: return
        
        await element.click()
        for char in text:
            await page.keyboard.type(char)
            await asyncio.sleep(random.uniform(*delay_range))

    async def click_human(self, page: Page, selector: str):
        """Simulate human click with random delay and movement."""
        element = await page.wait_for_selector(selector)
        if not element: return
        
        box = await element.bounding_box()
        if box:
            # Move mouse to random point within element
            x = box['x'] + (box['width'] * random.uniform(0.1, 0.9))
            y = box['y'] + (box['height'] * random.uniform(0.1, 0.9))
            await page.mouse.move(x, y, steps=5)
            await asyncio.sleep(random.uniform(0.1, 0.3))
        
        await element.click()

# Global service instance
browser_service = BrowserAutomationService()
