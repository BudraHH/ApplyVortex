"""LinkedIn-specific automation strategy."""

from typing import Dict, Any, Optional
from playwright.async_api import Page
from .base import PortalStrategy

class LinkedInStrategy(PortalStrategy):
    """LinkedIn-specific automation strategy."""
    
    def can_handle(self, url: str) -> bool:
        return "linkedin.com" in url.lower()
    
    async def apply(self, page: Page, user: Dict[str, Any], resume_path: str) -> Dict[str, Any]:
        result = {
            "success": False,
            "screenshots": [],
            "form_data": {},
            "error": None
        }
        
        try:
            self.logger.info("Starting LinkedIn application")
            
            s = await self.take_screenshot(page, "01_initial_page")
            if s: result["screenshots"].append(s)
            
            # Look for Easy Apply button
            if not await self._click_easy_apply(page):
                result["error"] = "Easy Apply button not found"
                return result
            
            await page.wait_for_timeout(2000)
            s = await self.take_screenshot(page, "02_easy_apply_modal")
            if s: result["screenshots"].append(s)
            
            # Fill form
            result["form_data"] = await self._fill_linkedin_form(page, user, resume_path)
            
            s = await self.take_screenshot(page, "03_form_filled")
            if s: result["screenshots"].append(s)
            
            # Submit
            if await self._submit_linkedin_application(page):
                s = await self.take_screenshot(page, "04_submitted")
                if s: result["screenshots"].append(s)
                result["success"] = True
                self.logger.info("LinkedIn application successful")
            else:
                result["error"] = "Failed to submit application"
                
            return result
        except Exception as e:
            self.logger.error(f"LinkedIn application failed: {e}")
            result["error"] = str(e)
            s = await self.take_screenshot(page, "error")
            if s: result["screenshots"].append(s)
            return result

    async def _click_easy_apply(self, page: Page) -> bool:
        selectors = [
            'button:has-text("Easy Apply")',
            'button[aria-label*="Easy Apply"]',
            '.jobs-apply-button:has-text("Easy Apply")',
            '.jobs-s-apply button:has-text("Easy Apply")'
        ]
        for sel in selectors:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible() and await el.is_enabled():
                    await el.click()
                    return True
            except: continue
        return False

    async def _fill_linkedin_form(self, page: Page, user: Dict[str, Any], resume_path: str) -> Dict[str, Any]:
        form_data = {}
        try:
            await page.wait_for_timeout(2000)
            
            # Phone
            phone = user.get('phone') or user.get('mobile_number')
            if phone:
                for sel in ['input[id*="phone"]', 'input[name*="phone"]', 'input[aria-label*="phone"]']:
                    try:
                        el = await page.query_selector(sel)
                        if el and await el.is_visible():
                            await el.fill(phone)
                            form_data['phone'] = phone
                            break
                    except: continue

            # Resume
            if resume_path:
                try:
                    await self._upload_resume_linkedin(page, resume_path)
                    form_data['resume_uploaded'] = True
                except Exception: form_data['resume_uploaded'] = False

            # Questions
            await self._handle_linkedin_questions(page, user, form_data)
            return form_data
        except Exception as e:
            self.logger.error(f"Form filling failed: {e}")
            raise

    async def _upload_resume_linkedin(self, page: Page, resume_path: str):
        selectors = [
            'input[type="file"][id*="resume"]',
            'input[type="file"][name*="resume"]',
            'input[type="file"][aria-label*="resume"]',
            'input[type="file"]'
        ]
        for sel in selectors:
            try:
                if await page.query_selector(sel):
                    await self.file_upload_handler.upload_file(page, sel, resume_path)
                    return
            except: continue
        raise Exception("Resume upload field not found")

    async def _handle_linkedin_questions(self, page: Page, user: Dict[str, Any], form_data: Dict[str, Any]):
        # Work Auth
        for sel in ['input[value="Yes"]:near(:text("authorized to work"))', 'input[value="Yes"]:near(:text("work authorization"))']:
            try:
                el = await page.query_selector(sel)
                if el: await el.check(); form_data['work_authorization'] = 'Yes'; break
            except: continue
            
        # Sponsorship
        for sel in ['input[value="No"]:near(:text("sponsorship"))', 'input[value="No"]:near(:text("visa sponsorship"))']:
            try:
                el = await page.query_selector(sel)
                if el: await el.check(); form_data['sponsorship'] = 'No'; break
            except: continue

        # Years Exp
        exp_years = str(user.get('years_experience', 3))
        for sel in ['input[id*="experience"]', 'select[id*="experience"]', 'input[name*="experience"]']:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    tag = await el.evaluate("el => el.tagName.toLowerCase()")
                    if tag == 'select': await el.select_option(value=exp_years)
                    else: await el.fill(exp_years)
                    form_data['years_experience'] = exp_years
                    break
            except: continue

    async def _submit_linkedin_application(self, page: Page) -> bool:
        # Loop for multi-step form (Next -> Next -> Review -> Submit)
        max_steps = 10
        for _ in range(max_steps):
            try:
                await page.wait_for_timeout(1000)
                
                # Check for Submit
                submit_sels = ['button:has-text("Submit application")', 'button:has-text("Submit")', 'button:has-text("Send application")']
                for sel in submit_sels:
                    btn = await page.query_selector(sel)
                    if btn and await btn.is_visible() and await btn.is_enabled():
                        await btn.click()
                        await page.wait_for_timeout(3000)
                        return True
                        
                # Check for Next/Review
                next_sels = ['button:has-text("Next")', 'button:has-text("Review")', 'button:has-text("Continue")']
                clicked_next = False
                for sel in next_sels:
                    btn = await page.query_selector(sel)
                    if btn and await btn.is_visible() and await btn.is_enabled():
                        await btn.click()
                        clicked_next = True
                        break
                
                if not clicked_next:
                    # Stuck or finished?
                    return False
            except Exception: return False
        return False
