"""
Smart Form Filler Utility
Uses Playwright's intelligent locators to find and fill form fields.
"""
import logging
import random
import asyncio
from typing import Dict, Any
from playwright.async_api import Page

logger = logging.getLogger(__name__)


async def human_delay(min_s=1, max_s=3):
    await asyncio.sleep(random.uniform(min_s, max_s))

async def upload_resume(page: Page, resume_path: str):
    file_input = await page.query_selector('input[type="file"]')
    if file_input and resume_path:
        await file_input.set_input_files(resume_path)
        return True
    return False

async def submit_application(page: Page):
    submit_btn = page.locator('button:has-text("Submit"), button[type="submit"]')
    if await submit_btn.count() > 0:
        await submit_btn.first.click()
        return True
    return False

async def fill_by_label(page: Page, label_text: str, value: Any):
    """Fills an input identified by its label text."""
    try:
        if not value: return False
        
        # Try different locator strategies
        locators = [
            page.get_by_label(label_text, exact=False),
            page.locator(f'label:has-text("{label_text}") + input'),
            page.locator(f'label:has-text("{label_text}")').locator('xpath=./following-sibling::input'),
            page.get_by_placeholder(label_text, exact=False)
        ]
        
        for locator in locators:
            if await locator.count() > 0 and await locator.first.is_visible():
                await locator.first.fill(str(value))
                logger.info(f"Filled field '{label_text}' with value.")
                return True
        return False
    except Exception as e:
        logger.debug(f"Failed to fill '{label_text}': {e}")
        return False

def compute_years(experience_list: list) -> str:
    """Computes total years of experience from a list of experience objects."""
    # Simplified logic: 3 years default if empty
    if not experience_list: return "3"
    # Placeholder for actual math logic if needed
    return "3"

def resolve_path(obj: Any, path: str) -> Any:
    """Safely resolves a string path (e.g., 'profile.first_name') against an object/dict."""
    try:
        # profile.first_name -> obj['first_name'] or obj.first_name
        parts = path.split('.')
        current = obj
        for part in parts:
            if part == 'profile': continue
            if isinstance(current, dict):
                current = current.get(part)
            else:
                current = getattr(current, part, None)
        return current
    except:
        return None

FIELD_MAP = {
    "first name": "profile.first_name",
    "last name": "profile.last_name",
    "email": "profile.email", 
    "phone": "profile.phone",
    "current title": "profile.current_role",
    "years experience": lambda p: compute_years(p.get('experience', []))
}

async def handle_generic_apply(page: Page, profile: Dict[str, Any], resume_path: str):
    """Generic heuristic-based form filler."""
    try:
        # Progressive Next → Next filling
        max_steps = 10
        for _ in range(max_steps):
            # Heuristic field filling
            for label, field_path in FIELD_MAP.items():
                if callable(field_path):
                    value = field_path(profile)
                else:
                    value = resolve_path(profile, field_path)
                
                if value:
                    await fill_by_label(page, label, value)
            
            # File uploads
            file_input = await page.query_selector('input[type="file"]')
            if file_input and resume_path:
                await file_input.set_input_files(resume_path)
                logger.info("Uploaded resume in generic flow.")
            
            # Check for Next vs Submit
            next_btn = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Save and Continue")')
            submit_btn = page.locator('button:has-text("Submit"), button[type="submit"]')
            
            if await next_btn.count() > 0 and await next_btn.first.is_visible():
                await next_btn.first.click()
                await page.wait_for_timeout(2000)
            elif await submit_btn.count() > 0 and await submit_btn.first.is_visible():
                await submit_btn.first.click()
                await page.wait_for_timeout(5000)
                return {"status": "success", "method": "generic"}
            else:
                break
                
        return {"status": "failed_needs_review", "error": "Could not find submission path"}
    except Exception as e:
        logger.error(f"Generic applier failed: {e}")
        return {"status": "failed", "error": str(e)}

async def fill_smart_form(page: Page, profile_data: Dict[str, Any]) -> Dict[str, Any]:
    # ... (Keep existing implementation or redirect to handle_generic_apply)
    return await handle_generic_apply(page, profile_data, None)
