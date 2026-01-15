"""LinkedIn job scraper implementation using Playwright."""

import re
import logging
import asyncio
import random
import hashlib
from typing import Any, Dict, List, Optional, Union
from urllib.parse import quote_plus, urljoin
from bs4 import BeautifulSoup

from agent.core.browser_service import browser_service
from .base_scraper import BaseScraper

logger = logging.getLogger(__name__)

class LinkedInScraper(BaseScraper):
    """LinkedIn job portal scraper using Playwright automation.
    
    Fixed URL parameters with %2C encoding for perfect filter accuracy.
    """
    
    def __init__(self):
        self.base_url = "https://www.linkedin.com"

    # --- Helper Methods ---
    def _extract_text(self, element, default: str = "") -> str:
        if element:
             return element.get_text(strip=True)
        return default

    def _extract_attribute(self, element, attribute: str, default: str = "") -> str:
        if element and element.has_attr(attribute):
            return element[attribute]
        return default

    def _make_absolute_url(self, url: str) -> str:
        """Make URL absolute and normalize it by removing query params and fragments."""
        if url.startswith('http'):
            normalized = url
        else:
            normalized = urljoin(self.base_url, url)
        
        # Remove query parameters and fragments for consistent URLs
        normalized = normalized.split('?')[0].split('#')[0]
        return normalized

    def _extract_job_id(self, url: str) -> str:
        """Extract numeric LinkedIn job ID from URL path.
        
        Handles various LinkedIn job URL formats:
        - /jobs/view/1234567890
        - /jobs/view/1234567890/
        - /jobs/view/1234567890?param=value
        - https://in.linkedin.com/jobs/view/software-engineer-at-company-1234567890
        """
        # First normalize the URL (remove query params)
        clean_url = url.split('?')[0].split('#')[0]
        
        # Extract the numeric job ID from the URL path
        # LinkedIn job IDs are typically 10 digits and appear at the end of the path
        match = re.search(r'/jobs/view/[^/]*?-?(\d{10})', clean_url)
        if match:
            return match.group(1)
        
        # Fallback: try to find any 10-digit number in the URL
        match = re.search(r'(\d{10})', clean_url)
        if match:
            return match.group(1)
        
        # Last resort: try to find any sequence of digits
        match = re.search(r'(\d+)', clean_url)
        if match:
            return match.group(1)
        
        # If all else fails, use MD5 hash (should rarely happen)
        logger.warning(f"Could not extract numeric job ID from URL: {url}, using hash")
        return hashlib.md5(clean_url.encode()).hexdigest()[:10]

    async def _human_delay(self, min_s: float = 1.0, max_s: float = 3.0) -> None:
        """Simulate random human pause."""
        await asyncio.sleep(random.uniform(min_s, max_s))
    # -----------------------

    def _build_search_url(
        self,
        keywords: List[str],
        location: str,
        date_posted: str = None,
        experience_level: List[str] = None,
        job_type: List[str] = None,
        work_mode: List[str] = None
    ) -> str:
        """Constructs the LinkedIn search URL with ALL filters - FIXED."""
        
        # 1. Keywords (unchanged - perfect)
        if isinstance(keywords, str):
            keywords = [keywords]
        
        keyword_string = ""
        if keywords:
            processed = [f'"{k}"' if " " in k else k for k in keywords]
            if len(processed) > 1:
                query = " OR ".join(processed)
                keyword_string = quote_plus(query)
            elif processed:
                keyword_string = quote_plus(processed[0])

        # Base URL
        base_url = "https://www.linkedin.com/jobs/search"
        params = []
        
        # 2. Base params
        if keyword_string:
            params.append(f"keywords={keyword_string}")
        if location:
            params.append(f"location={quote_plus(location)}")
        params.extend(["distance=25", "f_LF=on"])  # List view
        
        # 3. FIXED: Date Posted (✅ Perfect)
        if date_posted:
            tpr_map = {
                "past-month": "r2592000",
                "past-week": "r604800", 
                "past-24h": "r86400",
                "past-6h": "r21600",
                "past-3h": "r10800",
                "past-1h": "r3600"
            }
            if date_posted in tpr_map:
                params.append(f"f_TPR={tpr_map[date_posted]}")

        # 4. FIXED: Experience Level - URL ENCODED COMMAS
        if experience_level:
            exp_map = {
                "internship": "1", 
                "entry_level": "2", 
                "associate": "3", 
                "mid_senior": "4", 
                "director": "5", 
                "executive": "6"
            }
            levels = [experience_level] if isinstance(experience_level, str) else experience_level
            values = "%2C".join([exp_map.get(e, "") for e in levels if e in exp_map])
            if values:
                params.append(f"f_E={values}")

        # 5. FIXED: Job Type - URL ENCODED COMMAS
        if job_type:
            type_map = {
                "full_time": "F", 
                "part_time": "P", 
                "contract": "C", 
                "temporary": "T", 
                "internship": "I", 
                "volunteer": "V"
            }
            types = [job_type] if isinstance(job_type, str) else job_type
            values = "%2C".join([type_map.get(t, "") for t in types if t in type_map])
            if values:
                params.append(f"f_JT={values}")

        # 6. FIXED: Work Mode - URL ENCODED COMMAS (was correct, now consistent)
        if work_mode:
            mode_map = {"on_site": "1", "remote": "2", "hybrid": "3"}
            modes = [work_mode] if isinstance(work_mode, str) else work_mode
            values = "%2C".join([mode_map.get(m, "") for m in modes if m in mode_map])
            if values:
                params.append(f"f_WT={values}")

        # 7. NEW: Fresh jobs first (rtrvr.ai style)
        params.append("sortBy=DD")
        
        return f"{base_url}?{'&'.join(params)}"
    
    async def _ensure_authenticated(self) -> bool:
        """Checks if logged in. If not, launches interactive login."""
        # Initialize browser with config setting
        from config import settings
        if not browser_service._initialized:
            await browser_service.initialize(headless=settings.HEADLESS)
            
        # Use session pool for auth check
        session_id, context, page = await browser_service.get_page()
        try:
            logger.info("Checking authentication status...")
            await page.goto("https://www.linkedin.com/feed/", timeout=30000)
            await asyncio.sleep(2)
            
            # Check for logged-in indicators
            if "feed" in page.url or await page.query_selector(".global-nav__me-photo") or await page.query_selector(".feed-identity-module"):
                logger.info("User is authenticated.")
                return True
                
            logger.warning("User is NOT authenticated. Launching interactive login...")
            await browser_service.return_page(session_id, context, page)
            
            success = await browser_service.launch_interactive_session(
                url="https://www.linkedin.com/login",
                success_url_regex=r"linkedin.com/feed"
            )
            
            if success:
                logger.info("Interactive login successful! Resuming scraper...")
                return True
            else:
                logger.error("Interactive login failed or was closed without success.")
                return False
                
        except Exception as e:
            logger.error(f"Auth check failed: {e}")
            return False
        finally:
            if session_id and context and page:
                await browser_service.return_page(session_id, context, page)

    async def scrape(
        self, 
        keywords: List[str], 
        location: Union[List[str], str], 
        date_posted: Optional[str] = None,
        experience_level: Optional[Union[List[str], str]] = None,
        job_type: Optional[Union[List[str], str]] = None,
        work_mode: Optional[Union[List[str], str]] = None,
        check_cancelled: Any = None, 
        on_progress: Any = None
    ) -> List[Dict[str, Any]]:
        """
        Main entry point for scraping LinkedIn jobs - FIXED URL PARAMETERS.
        """
        if not await self._ensure_authenticated():
            logger.error("Cannot proceed with scraping: User not logged in.")
            return []
            
        locations = [location] if isinstance(location, str) else location
        MAX_JOBS_PER_LOCATION = 5 
        
        # Smart job type default
        current_job_type_default = "Unknown"
        if job_type:
            types = [job_type] if isinstance(job_type, str) else job_type
            if len(types) == 1:
                current_job_type_default = types[0].replace("_", " ").title()

        all_jobs_total = []
        global_seen_ids = set() 
        
        for loc in locations:
            if check_cancelled and await check_cancelled():
                logger.info("Scrape cancelled by user. Aborting location loop.")
                break
                
            logger.info(f"Starting scrape for Location: {loc} | Keywords: {keywords}")
            location_jobs = [] 
            session_id = None
            context = None
            page = None

            try:
                # 1. Build FIXED URL
                url = self._build_search_url(
                    keywords, loc, date_posted, 
                    experience_level, job_type, work_mode
                )
                logger.info(f"🔗 Search URL: {url}")
                
                # 2. Get page from session pool (STEALTH SYSTEM)
                from agent.core.human_simulator import HumanSimulator
                from agent.core.metrics import stealth_metrics
                
                session_id, context, page = await browser_service.get_page()
                
                try:
                    # 2. Navigate
                    logger.info(f"Navigating to {url}")
                    await HumanSimulator.random_pause(1.0, 3.0)
                    await page.goto(url, wait_until='domcontentloaded', timeout=45000)
                    await HumanSimulator.random_pause(3.0, 6.0)
                    
                    # 3. Intelligent Scroll & Load (HUMAN SIMULATION)
                    scroll_attempts = 0
                    max_scrolls = 25 
                    last_height = await page.evaluate("document.body.scrollHeight")
                    
                    while len(location_jobs) < MAX_JOBS_PER_LOCATION and scroll_attempts < max_scrolls:
                        if check_cancelled and await check_cancelled():
                            logger.info("Scrape cancelled by user. Aborting scroll loop.")
                            break
                        
                        # Human-like scroll (replaces instant scrollTo)
                        await HumanSimulator.human_scroll(page, direction='down', chunks=4)
                        await HumanSimulator.random_pause(2.0, 4.0)
                        
                        # Security checks with METRICS
                        try:
                            modal = await page.query_selector('.contextual-sign-in-modal')
                            if modal and await modal.is_visible():
                                logger.warning(f"🚨 Hit LinkedIn Login Wall. Stopping location.")
                                stealth_metrics.on_ban(session_id)
                                break
                            
                            verification = await page.query_selector('[data-test-id="verification-challenge"]') or await page.query_selector('.challenge-dialog')
                            if verification and await verification.is_visible():
                                logger.warning(f"🚨 Hit LinkedIn Verification Challenge. Stopping location.")
                                stealth_metrics.on_captcha(session_id)
                                
                                # Emergency restart if too many detections
                                if stealth_metrics.detection_events >= 3:
                                    await browser_service.emergency_restart()
                                break
                        except: 
                            pass

                        # See More button (human click)
                        try:
                            see_more_selector = 'button.infinite-scroller__show-more-button, button[aria-label="See more jobs"]'
                            see_more = await page.query_selector(see_more_selector)
                            if see_more and await see_more.is_visible():
                                await HumanSimulator.human_click(page, see_more_selector)
                                await HumanSimulator.random_pause(1.5, 2.5)
                        except:
                            pass

                        # Parse jobs (unchanged - perfect)
                        content = await page.content()
                        soup = BeautifulSoup(content, 'html.parser')
                        current_batch = self._parse_job_cards(soup, default_job_type=current_job_type_default)
                        
                        new_jobs_found = 0
                        for job in current_batch:
                            if job['external_id'] not in global_seen_ids:
                                global_seen_ids.add(job['external_id'])
                                location_jobs.append(job)
                                new_jobs_found += 1

                        if new_jobs_found > 0:
                            logger.info(f"  + Scraped {new_jobs_found} new jobs (Loc Total: {len(location_jobs)})")
                        else:
                            # Pagination
                            try:
                                next_button = await page.query_selector('button[aria-label="View next page"]') or await page.query_selector('.artdeco-pagination__button--next')
                                if next_button and await next_button.is_enabled():
                                    logger.info("  >> Clicking 'Next' Page...")
                                    await next_button.click()
                                    await asyncio.sleep(random.uniform(3.0, 5.0))
                                    last_height = 0 
                                    scroll_attempts += 1
                                    continue 
                            except:
                                pass

                            new_height = await page.evaluate("document.body.scrollHeight")
                            if new_height == last_height:
                                logger.info("  Reached bottom of results.")
                                break
                            last_height = new_height
                            
                        scroll_attempts += 1
                        
                    all_jobs_total.extend(location_jobs)

                    if on_progress and location_jobs:
                        logger.info(f"Syncing {len(location_jobs)} jobs from {loc} to server...")
                        await on_progress(location_jobs)

                    sleep_time = random.uniform(5.0, 10.0)
                    logger.info(f"Finished {loc}. Sleeping for {sleep_time:.2f}s...")
                    await asyncio.sleep(sleep_time)

                finally:
                    # Return page to pool (REUSE SESSION)
                    if session_id and context and page:
                        await browser_service.return_page(session_id, context, page)
                    
            except Exception as e:
                logger.error(f"Error scraping location {loc}: {e}")
                continue

        logger.info(f"Total Unique Jobs Scraped: {len(all_jobs_total)}")
        return all_jobs_total

    def _parse_job_cards(self, soup: BeautifulSoup, default_job_type: str = "Unknown") -> List[Dict[str, Any]]:
        """Parse job cards - unchanged (perfect)."""
        jobs = []
        job_cards = soup.find_all('div', {'class': re.compile(r'job-search-card|base-card')})
        if not job_cards:
            job_cards = soup.find_all('div', {'class': 'job-card-container'})

        for card in job_cards:
            try:
                title_el = card.find('h3', {'class': re.compile(r'job-search-card__title|base-search-card__title')})
                link_el = card.find('a', {'class': re.compile(r'job-search-card__title-link|base-card__full-link')})
                
                if not title_el:
                    title_el = card.find('a', {'class': 'job-card-container__link'})
                    link_el = title_el 
                
                if not title_el or not link_el: 
                    continue
                
                # Smart title extraction
                sr_only = title_el.find(class_=re.compile(r'sr-only|visually-hidden'))
                title = self._extract_text(sr_only) if sr_only else self._extract_text(title_el)
                
                if not title or title.count('*') > 2:
                    potential_title = self._extract_text(link_el)
                    if potential_title and potential_title.count('*') <= 2:
                        title = potential_title

                # Normalize URL (this now removes query params in _make_absolute_url)
                job_url = self._make_absolute_url(self._extract_attribute(link_el, 'href'))
                
                company_el = card.find('h4', {'class': re.compile(r'job-search-card__subtitle|base-search-card__subtitle')})
                if not company_el:
                    company_el = card.find('div', {'class': 'artdeco-entity-lockup__subtitle'})
                company = self._extract_text(company_el)
                
                location_el = card.find('span', {'class': re.compile(r'job-search-card__location|base-search-card__location')})
                if not location_el:
                    location_el = card.find('li', {'class': 'job-card-container__metadata-item'})
                location = self._extract_text(location_el)
                
                time_el = card.find('time')
                posted_date = self._extract_attribute(time_el, 'datetime') if time_el else "Recent"
                
                desc_el = card.find('div', {'class': re.compile(r'job-card-list__description-snippet')})
                if not desc_el:
                    desc_el = card.find('span', {'class': 'job-search-card__snippet'})
                description = self._extract_text(desc_el)
                description = description.split('Actively Hiring')[0].split(' ago')[0].strip()
                if description.endswith('...'): 
                    description = description[:-3]

                jobs.append({
                    "title": title,
                    "company": company,
                    "location": location,
                    "job_url": job_url,
                    "description": description or f"Role: {title} at {company}",
                    "external_id": self._extract_job_id(job_url),
                    "portal_slug": "linkedin",
                    "posted_date": posted_date,
                    "job_type": default_job_type 
                })
            except Exception as e:
                continue
                
        return jobs
