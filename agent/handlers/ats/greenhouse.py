import logging
import asyncio
from typing import Dict, Any
from playwright.async_api import Page
from agent.utils.form_filler import fill_by_label

logger = logging.getLogger(__name__)

async def handle_greenhouse(page: Page, profile: Dict[str, Any], resume_path: str) -> Dict[str, Any]:
    """Automates Greenhouse application process."""
    try:
        logger.info("Starting Greenhouse application flow")
        
        # Greenhouse is usually a single page
        await fill_by_label(page, "First Name", profile.get("first_name"))
        await fill_by_label(page, "Last Name", profile.get("last_name"))
        await fill_by_label(page, "Email", profile.get("email"))
        await fill_by_label(page, "Phone", profile.get("phone"))
        
        # Resume
        file_input = page.locator('input[type="file"][accept*="pdf"]').first
        if await file_input.count() > 0:
            await file_input.set_input_files(resume_path)
        
        # Custom Questions (Heuristic)
        await fill_by_label(page, "LinkedIn Profile", profile.get("linkedin_url"))
        await fill_by_label(page, "GitHub URL", profile.get("github_url"))
        
        # Submit
        submit_btn = page.locator('#submit_app')
        if await submit_btn.count() > 0:
            await submit_btn.click()
            await page.wait_for_timeout(5000)
            return {"status": "success", "method": "greenhouse"}
        
        return {"status": "failed", "error": "Submit button not found"}
    except Exception as e:
        logger.error(f"Greenhouse app failed: {e}")
        return {"status": "failed", "error": str(e)}
