import logging
import asyncio
from typing import Dict, Any
from playwright.async_api import Page
from agent.utils.form_filler import fill_by_label

logger = logging.getLogger(__name__)

async def handle_lever(page: Page, profile: Dict[str, Any], resume_path: str) -> Dict[str, Any]:
    """Automates Lever application process."""
    try:
        logger.info("Starting Lever application flow")
        
        # Lever often starts with resume upload to auto-fill
        file_input = page.locator('input[type="file"]').first
        if await file_input.count() > 0:
            await file_input.set_input_files(resume_path)
            await page.wait_for_timeout(3000) # Wait for auto-fill
            
        await fill_by_label(page, "Full name", f"{profile.get('first_name')} {profile.get('last_name')}")
        await fill_by_label(page, "Email", profile.get("email"))
        await fill_by_label(page, "Phone", profile.get("phone"))
        
        # Submit
        submit_btn = page.locator('button:has-text("Submit Application")').first
        if await submit_btn.count() > 0:
            await submit_btn.click()
            await page.wait_for_timeout(5000)
            return {"status": "success", "method": "lever"}
            
        return {"status": "failed", "error": "Submit button not found"}
    except Exception as e:
        logger.error(f"Lever app failed: {e}")
        return {"status": "failed", "error": str(e)}
