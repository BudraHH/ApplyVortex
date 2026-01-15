"""
Generic Scraper Executor for Agent Forge.
Uses dynamic blueprints (selectors) instead of hardcoded paths.
"""
import logging
from typing import Dict, Any, List
from typing import Dict, Any, List
from playwright.async_api import Page
import random
from agent.core.browser_service import browser_service

logger = logging.getLogger(__name__)


class ScraperExecutor:
    """
    Generic scraper that executes based on a blueprint (JSON config).
    The blueprint contains selectors, headers, and other portal-specific config.
    """
    
    def __init__(self, headless: bool = True, debug: bool = False):
        self.headless = headless
        self.debug = debug
    
    async def scrape(self, url: str, blueprint: dict) -> List[Dict[str, Any]]:
        """
        Execute a scrape based on the provided URL and blueprint.
        
        Args:
            url: The search URL to scrape
            blueprint: Dictionary containing:
                - selectors: Dict of CSS selectors for job cards, titles, etc.
                - headers: Optional dict of HTTP headers
                - name: Portal name (for logging)
        
        Returns:
            List of job dictionaries extracted from the page
        """
        jobs = []
        portal_name = blueprint.get('name', 'Unknown')
        selectors = blueprint.get('selectors', {})
        custom_headers = blueprint.get('headers', {})
        
        logger.info(f"Starting scrape for {portal_name} at {url}")
        
        async with await browser_service.get_playwright_context_manager() as _: # This line is tricky if browser_service manages lifecycle.
            # Actually, we should just use browser_service methods.
            pass

        # Use browser_service
        # Ensure initialized
        if not browser_service._initialized:
             await browser_service.initialize(headless=self.headless)

        context = None
        try:
             # Create session (loads cookies)
             context, page = await browser_service.create_session()
             
             # Set extra headers
             if custom_headers:
                 await page.set_extra_http_headers({
                     'Accept-Language': 'en-US,en;q=0.9',
                     'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                     **custom_headers
                 })
                 
             # Navigate to URL
             await page.goto(url, wait_until="networkidle", timeout=60000)
             
             # Random delay
             await page.wait_for_timeout(random.randint(2000, 4000))
             
             # Find job cards
             job_card_selector = selectors.get('job_card', 'li')
             job_cards = await page.query_selector_all(job_card_selector)
             
             if not job_cards:
                 logger.warning(f"No job cards found using selector: {job_card_selector}")
                 if self.debug:
                     await page.screenshot(path=f"debug_{portal_name}.png")
                 return jobs
             
             logger.info(f"Found {len(job_cards)} job cards")
             
             # Extract data
             for card in job_cards:
                 try:
                     job_data = await self._extract_job_data(card, selectors)
                     if job_data and job_data.get('title') != 'N/A':
                         jobs.append(job_data)
                 except Exception as e:
                     logger.error(f"Error extracting job from card: {e}")
                     continue
             
             logger.info(f"Successfully extracted {len(jobs)} jobs")

        except Exception as e:
            logger.error(f"Error during scraping: {e}")
            if self.debug and 'page' in locals(): # rudimentary check
                await page.screenshot(path=f"error_{portal_name}.png")
        finally:
            if context:
                await browser_service.browser_manager.close_context(context)
        
        return jobs
    
    async def _extract_job_data(self, card, selectors: dict) -> Dict[str, Any]:
        """
        Extract job data from a single card using the provided selectors.
        
        Args:
            card: Playwright element handle for the job card
            selectors: Dictionary of CSS selectors
        
        Returns:
            Dictionary with job data
        """
        job_data = {}
        
        # Extract each field using the blueprint selectors
        # Title
        job_data['title'] = await self._extract_text(
            card, 
            selectors.get('title', ['h3', 'a.job-title', '[class*="title"]'])
        )
        
        # Company
        job_data['company'] = await self._extract_text(
            card,
            selectors.get('company', ['h4', '[class*="company"]', 'a.company-name'])
        )
        
        # Location
        job_data['location'] = await self._extract_text(
            card,
            selectors.get('location', ['span.location', '[class*="location"]'])
        )
        
        # Job URL
        job_data['job_url'] = await self._extract_link(
            card,
            selectors.get('link', ['a', 'a.job-link', '[href*="/jobs/"]'])
        )
        
        # External ID (if available)
        job_data['external_id'] = await self._extract_attribute(
            card,
            'data-job-id',
            selectors.get('job_id_attr', None)
        )
        
        # Fallback: use URL as external_id if not found
        if not job_data.get('external_id'):
            job_data['external_id'] = job_data.get('job_url', 'unknown')
        
        return job_data
    
    async def _extract_text(self, element, selectors) -> str:
        """Try multiple selectors and return first non-empty text."""
        if isinstance(selectors, str):
            selectors = [selectors]
        
        for selector in selectors:
            try:
                el = await element.query_selector(selector)
                if el:
                    text = await el.inner_text()
                    if text and text.strip():
                        return text.strip()
            except Exception:
                continue
        
        return "N/A"
    
    async def _extract_link(self, element, selectors) -> str:
        """Try multiple selectors and return first href."""
        if isinstance(selectors, str):
            selectors = [selectors]
        
        for selector in selectors:
            try:
                el = await element.query_selector(selector)
                if el:
                    href = await el.get_attribute('href')
                    if href:
                        # Clean up URL (remove query params)
                        return href.split('?')[0]
            except Exception:
                continue
        
        return "N/A"
    
    async def _extract_attribute(self, element, attr_name: str, selector=None) -> str:
        """Extract an attribute value from element or child."""
        try:
            if selector:
                el = await element.query_selector(selector)
                if el:
                    val = await el.get_attribute(attr_name)
                    if val:
                        return val
            else:
                # Try on the element itself
                val = await element.get_attribute(attr_name)
                if val:
                    return val
        except Exception:
            pass
        
        return None
