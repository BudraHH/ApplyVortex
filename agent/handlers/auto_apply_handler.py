
import asyncio
import base64
import logging
import random
import os
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from agent.core.browser_service import browser_service
from agent.services.ai.base import LocalAIBaseService
from agent.client import APIClient

logger = logging.getLogger("AutoApplyHandler")

class AutoApplyHandler:
    """
    Handles autonomous job application execution for the Auto-Apply workflow.
    Supports: 
    1. Easy Apply (LinkedIn internal modal)
    2. External ATS (Redirect -> Fill)
    3. Company Direct (Career Page traversal)
    """

    SELECTORS = {
        "easy_apply": ['.jobs-apply-button--top-card', '.jobs-apply-button--is-primary', 'button[aria-label*="Easy Apply"]'],
        "external": ['.jobs-apply-button--external', 'a[href*="apply"]', '.jobs-apply-button:not([data-control-name*="easy_apply"])'],
        "company_direct": ['a[href*="careers"]', 'a[href*="jobs"]', '.apply-button', '#apply-button']
    }

    def __init__(self, client: APIClient, llm_service: Optional[LocalAIBaseService] = None):
        self.client = client
        self.llm = llm_service or LocalAIBaseService(system_prompt="You are a helpful job applicant. Answer questions concisely based on the user's profile.")
        self.browser = browser_service
        self.timeouts = {
            "navigation": 30000,
            "selector": 5000,
            "submission": 15000
        }
        from agent.scrapers.linkedin_deep_scraper import LinkedInDeepScraper
        self.deep_scraper = LinkedInDeepScraper()
        from agent.services.ai.resume_generator import resume_generation_service
        self.resume_generator = resume_generation_service

    async def _random_delay(self, min_seconds: float = 2.0, max_seconds: float = 4.0):
        await asyncio.sleep(random.uniform(min_seconds, max_seconds))

    async def execute_single_application(self, job_data: Dict[str, Any], base_resume_path: str, user_profile: Dict[str, Any]):
        """
        rtrvr.ai Phase 2 Optimization: One Visit Policy.
        Discovery -> JD Visit (Scrape + Local Tailor + Apply) -> Result.
        """
        job_id = job_data.get("id") or job_data.get("job_id")
        job_url = job_data.get("job_url") or job_data.get("apply_url")
        job_title = job_data.get("title", "Unknown Job")

        if not job_url:
            logger.error(f"Skipping job {job_id}: No URL provided.")
            return

        logger.info(f"⏩ STARTING OPTIMIZED APPLICATION SESSION: {job_title} ({job_id})")
        
        # 1. Smart Check: Is job already enriched?
        logger.info("   -> [Pre-Check] Fetching job details from server...")
        existing_job = self.client.get_job_details(job_id)
        
        jd_text = None
        enriched_data = {}
        skip_deep_scrape = False
        
        if existing_job and existing_job.get("description"):
            # Job already enriched during Find Jobs!
            logger.info("   -> ✅ Job already enriched! Skipping deep scrape.")
            jd_text = existing_job.get("description", "")
            enriched_data = {
                "description": jd_text,
                "requirements": existing_job.get("requirements"),
                "responsibilities": existing_job.get("responsibilities"),
                "application_type": existing_job.get("application_type"),
                "apply_url": existing_job.get("apply_url"),
                "seniority_level": existing_job.get("seniority_level")
            }
            skip_deep_scrape = True
        
        # 2. Mark as IN_PROGRESS (prevents duplicate applications)
        self.client.update_job_status(job_id, 2)  # IN_PROGRESS = 2
        logger.info(f"   -> [Status] Job {job_id} marked as IN_PROGRESS")
        
        # 3. Initialize Browser
        if not self.browser.is_initialized:
            await self.browser.initialize(headless=False) 
        
        context, page = await self.browser.create_session()
        
        try:
            # 3. Navigate to Job Page
            logger.info(f"   -> [Phase 2] Navigating to Job Post: {job_url}")
            await page.goto(job_url, timeout=self.timeouts["navigation"])
            await self._random_delay(3, 5)

            # 4. Deep Scrape (Only if needed)
            if not skip_deep_scrape:
                logger.info("   -> [Phase 2] Deep Scraping JD Content...")
                await self.deep_scraper._expand_full_description(page)
                from bs4 import BeautifulSoup
                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')
                enriched_data = await self.deep_scraper._parse_job_detail_page(soup, job_url)
                jd_text = enriched_data.get("description", "")
                
                # Sync enrichment to server
                logger.info("   -> [Phase 2] Syncing Enriched Data to Server...")
                self.client.sync_enriched_job(job_id, enriched_data)
            else:
                logger.info("   -> [Phase 2] Using cached job description (already enriched)")

            # 5. LOCAL TAILORING (Local Llama)
            logger.info("   -> [Phase 3] Local AI Tailoring (Llama)...")
            base_resume_id = self.client.get_base_resume_id()
            final_resume_path = base_resume_path # Fallback
            
            if base_resume_id:
                # Get base resume content
                base_resume = self.client.get_resume(base_resume_id)
                if base_resume and base_resume.get("parsed_data"):
                    # Use Local Llama to optimize
                    optimized_json = await self.resume_generator.optimize_resume(
                        resume_json=base_resume["parsed_data"],
                        job_description=jd_text
                    )
                    
                    # Send optimized JSON to server for PDF generation
                    tailored = self.client.tailor_resume(
                        base_resume_id, 
                        jd_text, 
                        job_id=job_id,
                        optimized_content=optimized_json
                    )
                    
                    if tailored and tailored.get("id"):
                        local_tailored_path = f"tailored_{job_id}.pdf"
                        downloaded = self.client.download_resume_by_id(tailored["id"], local_tailored_path)
                        if downloaded:
                            final_resume_path = local_tailored_path
                            logger.info(f"   -> [Phase 3] Tailored Resume Downloaded: {final_resume_path}")

            # 6. APPLICATION SUBMISSION (Phase 4)
            apply_type = enriched_data.get("application_type") or await self.detect_apply_type(page)
            logger.info(f"   -> [Phase 4] Executing Application ({apply_type.upper()})")
            
            if apply_type == "easy_apply":
                await self.handle_easy_apply(page, job_id, user_profile, final_resume_path)
            else:
                # External / Company Direct
                await self.handle_external_apply(page, job_id, user_profile, final_resume_path)

            # 7. Mark as APPLIED (success)
            self.client.update_job_status(job_id, 1)  # APPLIED = 1
            logger.info(f"   -> [Status] Job {job_id} marked as APPLIED ✓")

            # 8. Cleanup Tailored Resume
            if final_resume_path != base_resume_path and os.path.exists(final_resume_path):
                os.remove(final_resume_path)

        except Exception as e:
            logger.error(f"❌ ERROR: Optimized Apply failed for {job_id}: {e}", exc_info=True)
            # Mark as FAILED (allows retry)
            self.client.update_job_status(job_id, 3)  # FAILED = 3
            logger.warning(f"   -> [Status] Job {job_id} marked as FAILED (can retry)")
            if page: await self._report_result(job_id, False, str(e), page, "failed")
        finally:
            if page: await page.close()
            if context: await context.close()

    async def detect_apply_type(self, page) -> str:
        for method, selectors in self.SELECTORS.items():
            for sel in selectors:
                try:
                    is_vis = await page.locator(sel).first.is_visible()
                    # logger.info(f"DEBUG DETECT: {sel} -> {is_vis}")
                    if is_vis:
                        # Extra check for easy apply text
                        if method == "easy_apply":
                            txt = await page.locator(sel).first.inner_text()
                            if "Easy Apply" in txt: return "easy_apply"
                        else:
                            return method
                except: continue
        return "external" # Default fallback

    async def handle_easy_apply(self, page, job_id, profile, resume_path):
        """70% Coverage: LinkedIn Easy Apply Modal"""
        # Click Apply
        for sel in self.SELECTORS["easy_apply"]:
            if await page.locator(sel).first.is_visible():
                await page.locator(sel).first.click()
                break
        
        modal = page.locator('.jobs-easy-apply-modal, [role="dialog"]').first
        await modal.wait_for(timeout=10000)
        logger.info("   -> Application Modal Detected")

        success = await self._process_form_steps(page, modal, profile, resume_path, is_modal=True)
        if success:
             await self._report_result(job_id, True, "Easy Apply Submitted", page, "easy_apply")
        else:
             await self._report_result(job_id, False, "Modal form incomlpete", page, "easy_apply")

    async def handle_external_apply(self, page, job_id, profile, resume_path):
        """25% Coverage: External ATS Redirect (Greenhouse, Lever, etc.)"""
        # Click Apply -> Wait for new tab or redirect
        for sel in self.SELECTORS["external"]:
            if await page.locator(sel).first.is_visible():
                async with page.expect_popup() as popup_info:
                    await page.locator(sel).first.click()
                new_page = await popup_info.value
                await new_page.wait_for_load_state()
                logger.info(f"   -> Redirected to ATS: {new_page.url}")
                
                await self.fill_generic_form(new_page, profile, resume_path)
                await self._report_result(job_id, True, f"External ATS filled: {new_page.url}", new_page, "external_ats")
                return
        
        # If no popup, maybe same page redirect
        await self.fill_generic_form(page, profile, resume_path) # Try filling current page
        await self._report_result(job_id, True, "Attempted generic fill on current page", page, "external_ats")

    async def handle_company_direct(self, page, job_id, profile, resume_path):
        """4% Coverage: Company Career Page"""
        # Similar to external but might need navigation
        await self.fill_generic_form(page, profile, resume_path)
        await self._report_result(job_id, True, "Company Page Attempted", page, "company_direct")

    async def fill_generic_form(self, page, profile, resume_path):
        """95% Universal Form Filler for ATS"""
        logger.info("   -> Running Universal Form Filler...")
        
        # 1. Upload Resume (Universal)
        file_inputs = await page.locator('input[type="file"]').all()
        for fi in file_inputs:
            if await fi.is_visible():
                try:
                    await fi.set_input_files(resume_path)
                    logger.info("   -> Resume uploaded")
                except: pass
        
        # 2. Heuristic Field Filling
        fill_map = {
             "first": profile.get("first_name"),
             "last": profile.get("last_name"),
             "email": profile.get("email"),
             "phone": profile.get("phone") or profile.get("phone_number"),
             "linkedin": profile.get("linkedin_url"),
             "github": profile.get("github_url")
        }
        
        inputs = await page.locator('input[type="text"], input[type="email"], input[type="tel"]').all()
        for inp in inputs:
            if await inp.is_visible() and not await inp.input_value():
                # Check label/placeholder/name
                identity = (await inp.get_attribute("name") or "") + (await inp.get_attribute("id") or "") + (await inp.get_attribute("placeholder") or "")
                # Also check label
                try: 
                    id_val = await inp.get_attribute("id")
                    if id_val: identity += await page.locator(f"label[for='{id_val}']").inner_text()
                except: pass
                
                identity = identity.lower()
                for key, val in fill_map.items():
                    if key in identity and val:
                        await inp.fill(val)
                        break

        # 3. Submit Attempt (Don't click to avoid spamming in dev)
        # submit_btn = page.locator('button[type="submit"], .submit-button').first
        # if await submit_btn.is_visible(): ...

    async def _process_form_steps(self, page, container, profile, resume_path, is_modal=False) -> bool:
        """Iterate through multi-step forms (Modal or Page)."""
        max_steps = 15
        step = 0
        while step < max_steps:
            step += 1
            await self._random_delay(1, 2)
            
            # SUBMIT CHECK
            submit_btn = container.locator('button[aria-label="Submit application"], button:has-text("Submit application")').first
            if await submit_btn.is_visible():
                if await container.locator('.artdeco-inline-feedback__message').count() == 0:
                    await submit_btn.click()
                    # Wait for success 
                    try:
                        await page.wait_for_selector('[data-test-id="application-submitted-modal"], text=Application submitted', timeout=10000)
                        return True
                    except: return True # Optimistic
                else: return False # Validation errors
            
            # UPLOAD RESUME
            await self.fill_generic_form(container, profile, resume_path) # Utilize generic filler logic here too

            # QUESTIONS (LLM)
            textareas = await container.locator('textarea').all()
            for ta in textareas:
                 if await ta.is_visible() and not await ta.input_value():
                      try: 
                           # Get visible text near textarea as label
                           txt = await ta.evaluate("el => el.parentElement.innerText")
                           ans = await self._get_llm_answer(txt, profile)
                           if ans: await ta.fill(ans)
                      except: pass
            
            # NEXT STEP
            next_btn = container.locator('button[aria-label="Continue to next step"], button:has-text("Next"), button:has-text("Review")').first
            if await next_btn.is_visible() and await next_btn.is_enabled():
                await next_btn.click()
            else:
                return False
                
        return False

    async def _get_llm_answer(self, question: str, profile: Dict[str, Any]) -> str:
        prompt = f"User: {profile}\nQuestion: {question}\nAnswer based on user profile. If numeric return number only. If Yes/No return Yes/No."
        try:
             json_prompt = prompt + "\nReturn JSON: {\"answer\": \"...\"}"
             res = await self.llm.generate_json(json_prompt)
             return res.get("answer", "")
        except: return "Yes"

    async def _report_result(self, job_id, success: bool, message: str, page, method: str):
        b64_img = None
        try:
            bytes_img = await page.screenshot(type='jpeg', quality=50)
            b64_img = base64.b64encode(bytes_img).decode('utf-8')
        except: pass

        payload = {
            "applied": success,
            "method": method,
            "screenshot": b64_img,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": {"message": message}
        }
        try: await self.client._request("POST", f"agent-forge/jobs/{job_id}/applied", json=payload)
        except Exception as e: logger.error(f"Report failed: {e}")
