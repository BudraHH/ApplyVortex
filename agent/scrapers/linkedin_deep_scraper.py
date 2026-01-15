"""Deep job detail scraping with rate limiting, session rotation, and full JD expansion."""

import re
import logging
import asyncio
import random
import hashlib
from typing import Any, Dict, Optional
from bs4 import BeautifulSoup

from agent.core.browser_service import browser_service

logger = logging.getLogger(__name__)

class LinkedInDeepScraper:
    """Deep scraper for individual LinkedIn job pages with safeguards."""
    
    def __init__(self):
        self.base_url = "https://www.linkedin.com"
        self.jobs_scraped_in_session = 0
        self.MAX_JOBS_PER_SESSION = 10  # Rotate context after 10 jobs
    
    async def scrape_job_details(
        self, 
        job_url: str,
        context=None,
        page=None
    ) -> Optional[Dict[str, Any]]:
        """
        Scrape full details from individual LinkedIn job page.
        
        Args:
            job_url: LinkedIn job URL
            context: Optional existing browser context (for session reuse)
            page: Optional existing page (for session reuse)
            
        Returns:
            Enriched job data or None if failed
        """
        should_close_context = False
        
        try:
            # Create new context if not provided or session limit reached
            if not context or self.jobs_scraped_in_session >= self.MAX_JOBS_PER_SESSION:
                if context:
                    logger.info("Session limit reached. Rotating browser context...")
                    await browser_service.browser_manager.close_context(context)
                
                context, page = await browser_service.create_session()
                self.jobs_scraped_in_session = 0
                should_close_context = True
                
                # Extra delay after context rotation
                await asyncio.sleep(random.uniform(5.0, 8.0))
            
            # Human-like delay before navigation (3-5 min as specified)
            delay = random.uniform(180, 300)  # 3-5 minutes in seconds
            logger.info(f"Deep scraping {job_url} after {delay/60:.1f}min delay...")
            await asyncio.sleep(delay)
            
            # Navigate to job page
            logger.info(f"Navigating to job detail page...")
            await page.goto(job_url, wait_until='domcontentloaded', timeout=45000)
            await asyncio.sleep(random.uniform(3.0, 6.0))  # Initial reading delay
            
            # Check for security modals FIRST
            if await self._check_security_modals(page):
                logger.warning("Security modal detected. Aborting deep scrape.")
                return None
            
            # ✅ CRITICAL: Expand full job description
            await self._expand_full_description(page)
            
            # Extract page content AFTER expansion
            content = await page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Parse detailed job information
            job_data = await self._parse_job_detail_page(soup, job_url)
            
            self.jobs_scraped_in_session += 1
            logger.info(f"Successfully scraped job details ({self.jobs_scraped_in_session}/{self.MAX_JOBS_PER_SESSION} in session)")
            
            return job_data
            
        except Exception as e:
            logger.error(f"Error scraping job details: {e}")
            return None
        
        finally:
            if should_close_context and context:
                await browser_service.browser_manager.close_context(context)
    
    async def _expand_full_description(self, page):
        """Click 'See More' to expand full job description."""
        try:
            # Measure initial length to verify expansion later
            initial_desc_el = await page.query_selector('.jobs-description__content, #job-details, .description__text')
            initial_length = len(await initial_desc_el.inner_text()) if initial_desc_el else 0
            
            # Wait for and click expand button (modern LinkedIn 2026)
            expand_selectors = [
                '.jobs-description__footer-button[aria-expanded="false"]',
                'button.jobs-description__footer-button',
                'button:has-text("See more")',
                '[data-test-id="description-see-more"]'
            ]
            
            for selector in expand_selectors:
                try:
                    expand_btn = await page.wait_for_selector(selector, timeout=3000)
                    if expand_btn and await expand_btn.is_visible():
                        logger.info(f"Clicking expand button: {selector}")
                        await expand_btn.click()
                        
                        # Wait for expansion (content length to increase)
                        for _ in range(20): # 4 seconds max
                            await asyncio.sleep(0.2)
                            new_desc_el = await page.query_selector('.jobs-description__content, #job-details, .description__text')
                            if new_desc_el:
                                new_length = len(await new_desc_el.inner_text())
                                if new_length > initial_length + 100: # Significant increase
                                    logger.info(f"Job description expanded successfully (Len: {initial_length} -> {new_length})")
                                    return
                        
                        logger.warning("Expand validation failed: Content length did not increase significantly.")
                        return
                except:
                    continue
            
            logger.info("No expand button found or description already expanded.")
        except Exception as e:
            logger.warning(f"Could not expand description: {e}")
    
    async def _check_security_modals(self, page) -> bool:
        """Check for LinkedIn security challenges. Returns True if modal detected."""
        try:
            selectors = [
                '.contextual-sign-in-modal',
                '[data-test-id="verification-challenge"]',
                '.challenge-dialog',
                '#captcha-internal',
                '.security-checkpoint',
                '[data-test-id*="login-wall"]'
            ]
            
            for selector in selectors:
                elem = await page.query_selector(selector)
                if elem and await elem.is_visible():
                    logger.warning(f"Security challenge detected: {selector}")
                    return True
            
            return False
        except:
            return False
    
    async def _parse_job_detail_page(self, soup: BeautifulSoup, job_url: str) -> Dict[str, Any]:
        """Parse comprehensive job details from LinkedIn job page."""
        
        # 1. Job Title (Enhanced selectors)
        title_el = (
            soup.find('h1', {'class': re.compile(r't-24 t-bold|job-details-jobs-unified-top-card__job-title|top-card-layout__title')}) or
            soup.find('h1', class_=re.compile(r'topcard__title'))
        )
        title = self._extract_text(title_el)
        
        # 2. Company Name (Enhanced)
        company_el = (
            soup.find('div', {'class': 'job-details-jobs-unified-top-card__company-name'}) or
            soup.find('a', {'class': re.compile(r'topcard__org-name-link|top-card-layout__subtitle-link')}) or
            soup.find('span', {'class': re.compile(r'topcard__flavor--black-link')})
        )
        company = self._extract_text(company_el)
        
        # 3. Location (Enhanced)
        location_el = (
            soup.find('span', {'class': re.compile(r'tvm__text--low-emphasis')}) or
            soup.find('span', {'class': re.compile(r'topcard__flavor--bullet|top-card-layout__second-subline')})
        )
        location_raw = self._extract_text(location_el)
        location = re.sub(r' ·.*', '', location_raw).strip()  # Clean "Chennai · 20 hours ago"
        
        # 4. Full Job Description (PRIORITIZE expanded)
        description_selectors = [
            'div.jobs-description__content:not(.jobs-description__content--condensed)',  # Expanded
            'div.jobs-description__content',  # Any description
            'div#job-details',
            'section.description'
        ]
        
        description = ""
        for selector in description_selectors:
            desc_el = soup.select_one(selector)
            if desc_el:
                description = desc_el.get_text(separator='\n', strip=True)
                break
        
        # Warn if condensed
        if 'jobs-description__content--condensed' in str(soup):
            logger.warning("Using condensed description - consider retrying expansion")
        
        # 5. Extract Structured Sections (Enhanced)
        requirements = self._extract_section(description, ['requirements', 'qualifications', 'skills', 'basic qualifications'])
        responsibilities = self._extract_section(description, ['responsibilities', 'duties', 'you will', 'position summary'])
        
        # 6. Job Metadata (Enhanced - Job Criteria)
        job_type = None
        work_mode = None
        seniority_level = None
        
        # Method A: Parse from Job Criteria List (Reliable for Seniority/Emp Type)
        criteria_list = soup.find('ul', {'class': re.compile(r'description__job-criteria-list')})
        if criteria_list:
            for item in criteria_list.find_all('li'):
                header = self._extract_text(item.find('h3')).lower()
                content = self._extract_text(item.find('span'))
                
                if 'seniority' in header:
                    seniority_level = content
                elif 'employment' in header:
                    job_type = content
        
        # Method B: Parse from Top Card Badges (Fallback)
        if not job_type or not work_mode:
            pref_buttons = soup.find_all(['span', 'button'], class_=re.compile(r'job-details-jobs-unified-top-card__job-insight|jobs-unified-top-card__workplace-type'))
            for btn in pref_buttons:
                btn_text = self._extract_text(btn)
                # Check for Work Mode
                if any(x in btn_text.lower() for x in ['on-site', 'remote', 'hybrid']):
                    work_mode = btn_text.strip()
                # Check for Job Type if not found
                if not job_type and any(x in btn_text.lower() for x in ['full-time', 'part-time', 'contract']):
                    job_type = btn_text.strip()

        # Promoted detection
        promoted_text = soup.find(string=re.compile(r'Promoted by hirer', re.I))
        is_promoted = bool(promoted_text)
        
        # 7. Salary
        salary_el = soup.find('span', {'class': re.compile(r'salary|compensation')})
        salary = self._extract_text(salary_el)
        
        # 8. Apply Information (Optimized)
        apply_btn = soup.find('button', {'class': re.compile(r'jobs-apply-button')})
        is_easy_apply = False
        apply_url = job_url # Default
        
        if apply_btn:
            is_easy_apply = 'easy-apply' in str(apply_btn).lower() or 'Easy Apply' in self._extract_text(apply_btn)
            
            # Extract External URL if NOT Easy Apply
            if not is_easy_apply:
                 # Try to get 'href' (wrapper anchor or button attribute)
                 # 1. Check parent <a>
                 parent_a = apply_btn.find_parent('a')
                 if parent_a and parent_a.get('href'):
                     apply_url = parent_a.get('href')
                 # 2. Check hidden attributes or onclick (Limited in static soup, but 'href' often exists)
                 elif apply_btn.get('href'): # Sometimes button mocks a link
                     apply_url = apply_btn.get('href')
        
        # 9. Posted / Applicants
        metadata_span = soup.find('span', {'class': re.compile(r'tvm__text')})
        posted = self._extract_posted_date(metadata_span)
        applicants = self._extract_applicants(metadata_span)
        
        return {
            'title': title or "Unknown",
            'company': company or "Unknown",
            'location': location or "Unknown",
            'description': description[:5000], 
            'requirements': requirements,
            'responsibilities': responsibilities,
            'salary': salary,
            'job_type': job_type,
            'workplace_type': work_mode,
            'seniority_level': seniority_level, # NEW
            'is_promoted': is_promoted,
            'is_easy_apply': is_easy_apply,
            'apply_url': apply_url, 
            'posted_date': posted,
            'applicants': applicants,
            'job_url': job_url,
            'external_id': self._extract_job_id(job_url),
            'description_expanded': len(description) > 500
        }
    
    def _extract_posted_date(self, metadata_el):
        """Extract posted date from metadata."""
        if not metadata_el:
            return None
        text = self._extract_text(metadata_el)
        date_match = re.search(r'(\d+ (hours?|days?|weeks?|months?) ago)', text, re.I)
        return date_match.group(1) if date_match else None
    
    def _extract_applicants(self, metadata_el):
        """Extract applicant count."""
        if not metadata_el:
            return None
        text = self._extract_text(metadata_el)
        appl_match = re.search(r'(\d+(?:,\d+)? people clicked apply|(\d+) applicants?)', text, re.I)
        return appl_match.group(1) if appl_match else None
    
    # Existing helper methods unchanged...
    def _extract_section(self, text: str, keywords: list) -> str:
        """Extract specific section from job description."""
        if not text:
            return ""
        
        lines = text.split('\n')
        section_lines = []
        capturing = False
        
        for line in lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in keywords):
                capturing = True
                continue
            if capturing and line.isupper() and len(line) > 10:
                break
            if capturing:
                section_lines.append(line)
        
        return '\n'.join(section_lines).strip()[:1000]
    
    def _extract_text(self, element, default: str = "") -> str:
        if element:
            return element.get_text(strip=True)
        return default
    
    def _extract_attribute(self, element, attribute: str, default: str = "") -> str:
        if element and element.has_attr(attribute):
            return element[attribute]
        return default
    
    def _extract_job_id(self, url: str) -> str:
        match = re.search(r'/view/(\d+)', url) or re.search(r'-(\d+)\?', url)
        if match:
            return match.group(1)
        return hashlib.md5(url.encode()).hexdigest()[:10]

# Singleton instance
deep_scraper = LinkedInDeepScraper()
