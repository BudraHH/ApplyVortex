"""Naukri job scraper implementation using Playwright."""

import re
import logging
import asyncio
import random
import hashlib
from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus, urljoin

from agent.core.browser_service import browser_service
from .base_scraper import BaseScraper

logger = logging.getLogger(__name__)

class NaukriScraper(BaseScraper):
    """Naukri job portal scraper using Playwright automation.
    
    Includes advanced features:
    - Cartesian Loop (Iterate Locations x Combined Keywords)
    - Salary Bucket Mapping
    - Smart Freshness Filtering
    - Experience Level Mapping
    - Anti-bot delays
    """
    
    def __init__(self):
        self.base_url = "https://www.naukri.com"

    # --- Helper Methods ---
    def _clean_url(self, url: str) -> str:
        if not url: return ""
        return url.split('?')[0]
    
    def _extract_job_id(self, url: str) -> str:
        # Naukri URLs end like ...-job-id-1234567890
        match = re.search(r'(\d{10,})', url)
        if match: return match.group(1)
        return hashlib.md5(url.encode()).hexdigest()[:10]
    
    def _map_experience(self, levels: List[str]) -> str:
        """Maps blueprint experience levels to Naukri experience params."""
        # Default to 0 if nothing provided
        if not levels: return "0"
        
        # Naukri uses 'experience' param which takes a single starting year usually
        # We pick the lowest relevant number to be inclusive
        mapping = {
            "internship": "0",
            "entry-level": "0",
            "associate": "2",
            "mid-senior": "5",
            "director": "10",
            "executive": "15"
        }
        # Find the minimum experience year requested
        # e.g. ["associate", "mid-senior"] -> min(2, 5) -> 2
        min_exp = 100
        for lvl in levels:
            val = int(mapping.get(lvl, "0"))
            if val < min_exp:
                min_exp = val
        
        return str(min_exp) if min_exp != 100 else "0"
    # ----------------------

    def _build_search_url(
        self,
        keywords: List[str],
        location: str,
        job_type: str = "full-time",
        experience_levels: List[str] = None,
        date_posted: str = None,
        min_salary: int = None
    ) -> str:
        
        # 1. Base URL Structure: https://www.naukri.com/{keywords}-jobs-in-{location}
        # This SEO-friendly URL is less bot-detected than generic search?k=...
        
        # Combined Keywords (Boolean OR is implicit in hyphenated path for Naukri)
        # "Data Scientist", "ML Engineer" -> "data-scientist-ml-engineer"
        seo_keywords = "-".join([k.replace(" ", "-").lower() for k in keywords])
        seo_location = location.replace(" ", "-").lower() if location else ""
        
        base_url = f"https://www.naukri.com/{seo_keywords}-jobs-in-{seo_location}"
        
        # 2. Query Parameters
        params = []
        
        # Keyword Fallback (Just in case path isn't enough)
        k_str = "%20".join([quote_plus(k) for k in keywords])
        params.append(f"k={k_str}")
        
        if location:
            params.append(f"l={quote_plus(location)}")

        # Experience Mapping
        exp_val = self._map_experience(experience_levels)
        params.append(f"experience={exp_val}") 
        
        # Freshness (Date Posted)
        if date_posted:
            freshness_map = {
                "past-24h": "1",
                "past-week": "7",
                "past-month": "30"
            }
            val = freshness_map.get(date_posted)
            if val:
                params.append(f"freshness={val}")
                # If 1h or 24h, forcing sort by Date helps getting newest
                if date_posted in ["past-24h", "past-1h"]:
                    params.append("sort=date")

        # Salary Filters (Naukri Buckets)
        # Naukri uses 'ctcFilter' with values like '3to6', '6to10'
        if min_salary:
            salary_buckets = []
            # Logic: If min is 3LPA, we want 3-6 AND everything above it
            if min_salary <= 300000:
                salary_buckets.extend(["3to6", "6to10", "10to15", "15to25", "25to50", "50to75", "75to100"])
            elif min_salary <= 600000:
                salary_buckets.extend(["6to10", "10to15", "15to25", "25to50", "50to75", "75to100"])
            elif min_salary <= 1000000:
                salary_buckets.extend(["10to15", "15to25", "25to50", "50to75", "75to100"])
            elif min_salary <= 1500000:
                salary_buckets.extend(["15to25", "25to50", "50to75", "75to100"])
            
            for bucket in salary_buckets:
                params.append(f"ctcFilter={bucket}")

        # Job Type (Naukri usually handles this via keywords or specialized params)
        if job_type == "internship":
            params.append("qinternshipFlag=true")

        return f"{base_url}?{'&'.join(params)}"

    async def scrape(
        self,
        keywords: List[str],
        locations: Any,
        limit: int = 50,
        job_type: str = "full-time",
        experience_levels: List[str] = None,
        date_posted: str = None, 
        min_salary: int = None,
        check_cancelled: Any = None,
        on_progress: Any = None
    ) -> List[Dict[str, Any]]:
        
        # Ensure locations is a list
        loc_list = [locations] if isinstance(locations, str) else locations
        all_jobs_total = []
        global_seen_ids = set() # Global Deduplication Set
        
        # Limit per location to ensure we don't get blocked
        limit_per_loc = 5

        for loc in loc_list:

            if check_cancelled and await check_cancelled():
                logger.info("Scrape cancelled by user. Aborting Naukri location loop.")
                break
                
            logger.info(f"Starting Naukri scrape for Location: {loc}")
            session_id = None
            context = None
            page = None
            loc_jobs = []
            
            try:
                # 1. Build URL
                url = self._build_search_url(keywords, loc, job_type, experience_levels, date_posted, min_salary)
                
                # 2. Get page from session pool (STEALTH SYSTEM)
                from agent.core.human_simulator import HumanSimulator
                from agent.core.metrics import stealth_metrics
                
                session_id, context, page = await browser_service.get_page()
                
                try:
                    # 3. Navigate
                    logger.info(f"Navigating to {url}")
                    await page.goto(url, wait_until='domcontentloaded', timeout=60000)
                    
                    # 4. Check for "No Result" or Anti-Bot
                    content = await page.content()
                    if "No result found" in content:
                        logger.warning(f"No results for {loc}")
                        continue
                    
                    # CAPTCHA/Ban Detection with Metrics
                    if "captcha" in content.lower() or "suspicious activity" in content.lower():
                        logger.error("🚨 Naukri CAPTCHA/Block detected!")
                        stealth_metrics.on_captcha(session_id)
                        
                        # Take screenshot for debugging
                        await browser_service.take_screenshot(page, f"captcha_naukri_{loc}")
                        
                        # Emergency restart if too many detections
                        if stealth_metrics.detection_events >= 3:
                            await browser_service.emergency_restart()
                        continue

                    # 5. Scroll & Parse Loop (HUMAN SIMULATION)
                    scroll_attempts = 0
                    max_scrolls = 15
                    
                    while len(loc_jobs) < limit_per_loc and scroll_attempts < max_scrolls:
                        if check_cancelled and await check_cancelled():
                            logger.info("Scrape cancelled by user. Aborting Naukri scroll loop.")
                            break
                        
                        # Human-like scroll (replaces instant scrollTo)
                        await HumanSimulator.human_scroll(page, direction='down', chunks=3)
                        
                        # Natural reading pause
                        await HumanSimulator.random_pause(1.5, 3.0)
                        
                        # Parse Cards
                        # Naukri 2024 Selectors: .srp-jobtuple-wrapper or .list > article
                        cards = await page.query_selector_all(".srp-jobtuple-wrapper")
                        if not cards:
                             cards = await page.query_selector_all("article.jobTuple") # Fallback
                        
                        new_in_batch = 0
                        
                        for card in cards:
                            try:
                                # Extract Title & URL
                                title_el = await card.query_selector("a.title")
                                if not title_el: continue
                                
                                title = await title_el.inner_text()
                                job_url = await title_el.get_attribute("href")
                                job_url = self._clean_url(job_url)
                                ext_id = self._extract_job_id(job_url)
                                
                                # FIX: Check against GLOBAL set
                                if ext_id in global_seen_ids:
                                    continue
                                
                                # Extract Company
                                comp_el = await card.query_selector("a.comp-name")
                                company = await comp_el.inner_text() if comp_el else "Confidential"
                                
                                # Extract Location (Wait, we know the location is 'loc', but job might be specific)
                                loc_el = await card.query_selector("span.locWdth")
                                job_loc = await loc_el.inner_text() if loc_el else loc
                                
                                # Posted Date text (e.g. "Just Now", "1 Day Ago")
                                date_el = await card.query_selector("span.job-post-day")
                                posted_text = await date_el.inner_text() if date_el else "Unknown"

                                # Extract Description
                                desc_el = await card.query_selector(".job-description")
                                description = await desc_el.inner_text() if desc_el else f"Role: {title} at {company}"

                                # --- Client Side Filter for 1 Hour ---
                                if date_posted == "past-1h":
                                    # If not 'Just Now' or 'min ago', skip
                                    if "day" in posted_text.lower():
                                        continue # Too old
                                
                                job_obj = {
                                    "title": title.strip(),
                                    "company": company.strip(),
                                    "location": job_loc.strip(),
                                    "description": description.strip(),
                                    "job_url": job_url,
                                    "external_id": ext_id,
                                    "portal_slug": "naukri",
                                    "posted_date": posted_text
                                }
                                
                                loc_jobs.append(job_obj)
                                global_seen_ids.add(ext_id) # Add to GLOBAL set
                                new_in_batch += 1
                                
                                if len(loc_jobs) >= limit_per_loc:
                                    break
                                    
                            except Exception as e:
                                continue

                        if new_in_batch > 0:
                            logger.info(f"  + Scraped {new_in_batch} jobs in {loc}")
                        else:
                             # Try clicking "Next" if it exists? 
                             # Naukri usually is infinite scroll now, but sometimes pagination
                             pass
                        
                        scroll_attempts += 1
                    
                    # Add to master list
                    all_jobs_total.extend(loc_jobs)
                    
                    # Stream jobs to server
                    if on_progress and loc_jobs:
                        logger.info(f"Syncing {len(loc_jobs)} jobs from {loc} to server...")
                        await on_progress(loc_jobs)
                    
                    # Anti-bot Sleep
                    await asyncio.sleep(random.uniform(5.0, 8.0))

                finally:
                    # Return page to pool (REUSE SESSION)
                    if session_id and context and page:
                        await browser_service.return_page(session_id, context, page)

            except Exception as e:
                logger.error(f"Error scraping Naukri location {loc}: {e}")
                continue
                
        return all_jobs_total
