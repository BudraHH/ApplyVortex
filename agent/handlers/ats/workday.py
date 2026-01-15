"""
Workday ATS Handler
Handles account creation, email verification, and application flow for Workday jobs.
"""
import logging
import asyncio
from typing import Dict, Any
from playwright.async_api import Page

from agent.services.email.factory import EmailServiceFactory
from agent.utils.form_filler import fill_smart_form, upload_resume

logger = logging.getLogger(__name__)

class WorkdayHandler:
    """Automates Workday application process."""
    
    async def apply(self, page: Page, user_profile: Dict[str, Any], resume_path: str) -> Dict[str, Any]:
        result = {
            "success": False,
            "screenshots": [],
            "form_data": {},
            "error": None
        }
        
        try:
            logger.info("Starting Workday application flow")
            
            apply_btn = page.locator('a:has-text("Apply"), button:has-text("Apply")').first
            if await apply_btn.count() > 0:
                await apply_btn.click()
            
            await page.wait_for_timeout(3000)
            
            # --- ACCOUNT REUSE LOGIC ---
            # 1. Try to Sign In First
            sign_in_success = False
            
            # Look for Sign In button on landing page if not directly on form
            sign_in_trigger = page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first
            if await sign_in_trigger.count() > 0 and await sign_in_trigger.is_visible():
                logger.info("Attempting to Sign In with existing account...")
                await sign_in_trigger.click()
                await page.wait_for_timeout(2000)
                
                # Check for username/password fields
                try:
                    await page.fill('input[type="email"], input[id*="email"], input[id*="username"]', user_profile.get("email"))
                    await page.fill('input[type="password"], input[id*="password"]', user_profile.get("password") or "ApplyVortex123!")
                    await page.click('button:has-text("Sign In"), button:has-text("Login"), button[id*="submit"]')
                    await page.wait_for_timeout(5000)
                    
                    # If we don't see error, assume success
                    if await page.locator('text=Error').count() == 0 and await page.locator('text=Invalid').count() == 0:
                        sign_in_success = True
                        logger.info("Sign In appears successful.")
                    else:
                        logger.warning("Sign In failed (invalid credentials?). Falling back to Create Account.")
                except Exception as e:
                    logger.warning(f"Sign In attempt encountered issue: {e}. Falling back.")
            
            # 2. Create Account if Sign In failed or wasn't attempted
            if not sign_in_success:
                create_acc_btn = page.locator('button:has-text("Create Account")')
                if await create_acc_btn.count() > 0:
                    logger.info("Creating new Workday account...")
                    await create_acc_btn.click()
                    await page.wait_for_timeout(2000)
                    
                    email = user_profile.get("email")
                    password = user_profile.get("password") or "ApplyVortex123!" 
                    
                    await page.fill('input[type="email"], input[id*="email"]', email)
                    await page.fill('input[type="password"], input[id*="password"]', password)
                    
                    verify_pass = page.locator('input[id*="verifyPassword"]')
                    if await verify_pass.count() > 0:
                        await verify_pass.fill(password)
                        
                    await page.click('button:has-text("Create Account"), button[id*="submit"]')
                    await page.wait_for_timeout(5000)
            
            # Verification Loop
            verify_input = page.locator('input[id*="verificationCode"], input[aria-label*="code"]')
            if await verify_input.count() > 0:
                logger.info("Verification code requested. Fetching from email provider...")
                
                # FACTORY: Get appropriate provider
                user_email = user_profile.get("email", "")
                email_provider = EmailServiceFactory.get_provider(user_email)
                
                # Fetch code
                code = await email_provider.get_latest_verification_code(page.context, sender_keyword="Workday")
                
                if code:
                    logger.info(f"Entering code: {code}")
                    await verify_input.fill(code)
                    await page.click('button:has-text("Verify"), button:has-text("Submit")')
                    await page.wait_for_timeout(5000)
                else:
                    raise Exception(f"Could not retrieve verification code for {user_email}")
            
            # Quick Apply Resume
            upload_input = page.locator('input[type="file"]')
            if await upload_input.count() > 0 and resume_path:
                logger.info("Uploading resume...")
                await upload_input.set_input_files(resume_path)
                await page.wait_for_timeout(5000) 
            
            # Form Filling Loop
            logger.info("Filling remaining form fields...")
            max_steps = 10
            for _ in range(max_steps):
                await fill_smart_form(page, user_profile)
                
                next_btn = page.locator('button:has-text("Save and Continue"), button:has-text("Next")')
                if await next_btn.count() > 0 and await next_btn.is_visible():
                    await next_btn.click()
                    await page.wait_for_timeout(3000)
                    continue
                
                submit_btn = page.locator('button:has-text("Submit")')
                if await submit_btn.count() > 0 and await submit_btn.is_visible():
                    await submit_btn.click()
                    await page.wait_for_timeout(5000)
                    result["success"] = True
                    return result
            
            result["success"] = False 
            return result

        except Exception as e:
            logger.error(f"Workday app failed: {e}")
            result["error"] = str(e)
            return result

workday_handler = WorkdayHandler()
