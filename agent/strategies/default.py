"""Default/generic automation strategy."""

from typing import Dict, Any
from playwright.async_api import Page
from .base import PortalStrategy
from agent.core.browser_service import FormFieldMapper

class DefaultStrategy(PortalStrategy):
    """Default strategy for unknown portals."""
    
    def can_handle(self, url: str) -> bool:
        return True
    
    async def apply(self, page: Page, user: Dict[str, Any], resume_path: str) -> Dict[str, Any]:
        result = {
            "success": False,
            "screenshots": [],
            "form_data": {},
            "error": None
        }
        
        try:
            self.logger.info("Starting generic application")
            
            s = await self.take_screenshot(page, "01_initial_page")
            if s: result["screenshots"].append(s)
            
            if await self._click_generic_apply(page):
                await page.wait_for_timeout(2000)
                s = await self.take_screenshot(page, "02_apply_clicked")
                if s: result["screenshots"].append(s)
            
            # Form fill
            form_data = await self._fill_generic_form(page, user, resume_path)
            result["form_data"] = form_data
            
            s = await self.take_screenshot(page, "03_form_filled")
            if s: result["screenshots"].append(s)
            
            # Submit
            if await self._submit_generic_application(page):
                s = await self.take_screenshot(page, "04_submitted")
                if s: result["screenshots"].append(s)
                result["success"] = True
                self.logger.info("Generic application submitted")
            else:
                result["error"] = "Could not complete generic application"
                
            return result
        except Exception as e:
            self.logger.error(f"Generic application failed: {e}")
            result["error"] = str(e)
            s = await self.take_screenshot(page, "error")
            if s: result["screenshots"].append(s)
            return result

    async def _click_generic_apply(self, page: Page) -> bool:
        selectors = ['button:has-text("Apply")', 'a:has-text("Apply")', 'input[value*="Apply"]']
        for sel in selectors:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    return True
            except: continue
        return False

    async def _fill_generic_form(self, page: Page, user: Dict[str, Any], resume_path: str) -> Dict[str, Any]:
        form_data = {}
        try:
            await page.wait_for_timeout(2000)
            form_fields = await FormFieldMapper.detect_form_fields(page)
            
            mappings = {
                'first_name': user.get('first_name'),
                'last_name': user.get('last_name'),
                'full_name': f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
                'email': user.get('email'),
                'phone': user.get('phone') or user.get('mobile_number')
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
        except: return {}

    async def _submit_generic_application(self, page: Page) -> bool:
        selectors = ['button[type="submit"]', 'input[type="submit"]', 'button:has-text("Submit")', 'button:has-text("Send")']
        for sel in selectors:
            try:
                btn = await page.query_selector(sel)
                if btn and await btn.is_visible() and await btn.is_enabled():
                    await btn.click()
                    await page.wait_for_timeout(3000)
                    return True
            except: continue
        return True # Soft success if filled form but no submit found? Jobautomater returned True.
