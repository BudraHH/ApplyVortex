import logging
import os
import asyncio
import time
from typing import Dict, Any, Optional
from urllib.parse import urlparse

from agent.core.browser_service import browser_service
from agent.handlers.ats.workday import workday_handler
from agent.handlers.ats.greenhouse import handle_greenhouse
from agent.handlers.ats.lever import handle_lever
from agent.utils.form_filler import handle_generic_apply, fill_by_label

logger = logging.getLogger(__name__)

class ApplicationHandler:
    """
    3-Tier Application Strategy:
    1. Easy Apply Modal (LinkedIn/Indeed)
    2. Known ATS (Workday, Greenhouse, Lever)
    3. Generic Heuristic Applier
    """
    
    KNOWN_ATS = {
        "myworkdayjobs.com": workday_handler.apply,
        "greenhouse.io": handle_greenhouse,
        "lever.co": handle_lever
    }

    def __init__(self, headless: bool = True, debug: bool = False):
        self.headless = headless
        self.debug = debug

    async def apply(self, task_payload: Dict[str, Any]) -> Dict[str, Any]:
        job_url = task_payload.get("job_url")
        profile = task_payload.get("user_profile")
        resume_path = task_payload.get("resume_path")
        
        logger.info(f"Starting 3-tier application for: {job_url}")
        
        try:
            await browser_service.initialize(headless=self.headless)
            context, page = await browser_service.create_session()
            
            await page.goto(job_url)
            await page.wait_for_timeout(3000)

            # --- 1. EASY APPLY FIRST ---
            if await self.is_easy_apply(page):
                logger.info("Detected Easy Apply flow.")
                return await self.handle_easy_apply(page, profile, resume_path)

            # --- 2. KNOWN ATS ---
            domain = urlparse(job_url).netloc
            for ats_domain, handler in self.KNOWN_ATS.items():
                if ats_domain in domain:
                    logger.info(f"Detected Known ATS: {ats_domain}")
                    return await handler(page, profile, resume_path)

            # --- 3. GENERIC FALLBACK ---
            logger.info("Falling back to Generic Applier flow.")
            return await handle_generic_apply(page, profile, resume_path)

        except Exception as e:
            logger.error(f"Application failed: {e}", exc_info=True)
            return {"status": "FAILED", "error": str(e)}
        finally:
            # Browser service manages cleanup if needed
            pass

    async def is_easy_apply(self, page) -> bool:
        selectors = [
            'button:has-text("Easy Apply")',
            '[aria-label*="Easy Apply"]',
            'button[data-test-id="easy-apply-button"]',
            '.jobs-apply-button[data-automation-id*="easyApply"]'
        ]
        for sel in selectors:
            try:
                if await page.query_selector(sel):
                    return True
            except: continue
        return False

    async def handle_easy_apply(self, page, profile, resume_path) -> Dict[str, Any]:
        try:
            # CLICK → Modal opens
            await page.click('button:has-text("Easy Apply")')
            await page.wait_for_selector('.artdeco-modal', timeout=10000)
            
            max_steps = 10
            for _ in range(max_steps):
                # Check for Next/Continue
                next_btn = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Review")')
                
                if await next_btn.count() > 0 and await next_btn.first.is_visible():
                    btn_text = await next_btn.first.inner_text()
                    
                    # Fill current step (LinkedIn specific fields handled here or via generic filler)
                    # For simplicity, we use generic filler logic on current modal state
                    await handle_generic_apply(page, profile, resume_path)
                    
                    await next_btn.first.click()
                    await page.wait_for_timeout(2000)
                    
                    if "Submit" in btn_text:
                        break
                else:
                    # Maybe it's already on Submit?
                    submit_btn = page.locator('button:has-text("Submit application")')
                    if await submit_btn.count() > 0:
                        await submit_btn.click()
                        break
                    break
            
            # CONFIRMATION
            try:
                await page.wait_for_selector('[data-test-id*="submitted"], text=Application submitted', timeout=15000)
                return {"status": "SUCCESS", "method": "easy_apply"}
            except:
                return {"status": "FAILED", "error": "Submission confirmation not found"}
                
        except Exception as e:
            return {"status": "FAILED", "error": f"Easy Apply failed: {e}"}

    async def safe_click(self, page, selector, timeout=5000):
        try:
            await page.click(selector, timeout=timeout)
            return True
        except Exception:
            path = f"screenshots/error-{int(time.time())}.png"
            await page.screenshot(path=path)
            return False
