"""Indeed-specific automation strategy."""

from typing import Dict, Any
from playwright.async_api import Page
from .base import PortalStrategy
from agent.core.browser_service import FormFieldMapper

class IndeedStrategy(PortalStrategy):
    """Indeed-specific automation strategy."""
    
    def can_handle(self, url: str) -> bool:
        return "indeed.com" in url.lower()
    
    async def apply(self, page: Page, user: Dict[str, Any], resume_path: str) -> Dict[str, Any]:
        result = {
            "success": False,
            "screenshots": [],
            "form_data": {},
            "error": None
        }
        
        try:
            self.logger.info("Starting Indeed application")
            
            s = await self.take_screenshot(page, "01_initial_page")
            if s: result["screenshots"].append(s)
            
            if not await self._click_indeed_apply(page):
                result["error"] = "Apply button not found"
                return result
                
            await page.wait_for_timeout(2000)
            s = await self.take_screenshot(page, "02_apply_clicked")
            if s: result["screenshots"].append(s)
            
            result["form_data"] = await self._fill_indeed_form(page, user, resume_path)
            
            s = await self.take_screenshot(page, "03_form_filled")
            if s: result["screenshots"].append(s)
            
            if await self._submit_indeed_application(page):
                s = await self.take_screenshot(page, "04_submitted")
                if s: result["screenshots"].append(s)
                result["success"] = True
                self.logger.info("Indeed application successful")
            else:
                result["error"] = "Failed to submit Indeed application"
                
            return result
        except Exception as e:
            self.logger.error(f"Indeed application failed: {e}")
            result["error"] = str(e)
            s = await self.take_screenshot(page, "error")
            if s: result["screenshots"].append(s)
            return result

    async def _click_indeed_apply(self, page: Page) -> bool:
        selectors = [
            'button:has-text("Apply now")',
            'a:has-text("Apply now")',
            '.jobsearch-IndeedApplyButton',
            '[data-jk] button:has-text("Apply")'
        ]
        for sel in selectors:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    return True
            except: continue
        return False

    async def _fill_indeed_form(self, page: Page, user: Dict[str, Any], resume_path: str) -> Dict[str, Any]:
        form_data = {}
        try:
            await page.wait_for_timeout(2000)
            form_fields = await FormFieldMapper.detect_form_fields(page)
            
            # Map user data
            mappings = {
                'first_name': user.get('first_name'),
                'last_name': user.get('last_name'),
                'email': user.get('email'),
                'phone': user.get('phone') or user.get('mobile_number'),
                'full_name': f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
            }
            
            for f_type, val in mappings.items():
                if f_type in form_fields and val:
                    try:
                        await form_fields[f_type]['element'].fill(val)
                        form_data[f_type] = val
                    except: pass
            
            if resume_path and 'resume_upload' in form_fields:
                try:
                    await self.file_upload_handler.upload_file(page, form_fields['resume_upload']['selector'], resume_path)
                    form_data['resume_uploaded'] = True
                except: form_data['resume_uploaded'] = False
                
            return form_data
        except Exception as e:
            self.logger.error(f"Indeed form filling failed: {e}")
            raise

    async def _submit_indeed_application(self, page: Page) -> bool:
        try:
            selectors = ['button:has-text("Submit application")', 'button:has-text("Submit")', 'button[type="submit"]', 'input[type="submit"]']
            for sel in selectors:
                try:
                    btn = await page.query_selector(sel)
                    if btn and await btn.is_visible() and await btn.is_enabled():
                        await btn.click()
                        await page.wait_for_timeout(3000)
                        return True
                except: continue
            return False
        except Exception: return False
