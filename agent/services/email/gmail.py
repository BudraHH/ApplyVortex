"""
Gmail Provider Implementation
"""
import logging
import re
from typing import Optional
from playwright.async_api import BrowserContext

from .base import EmailProvider

logger = logging.getLogger(__name__)

class GmailProvider(EmailProvider):
    """
    Automates Gmail interactions using Playwright.
    Requires the browser context to have valid Gmail session/cookies.
    """
    
    async def get_latest_verification_code(self, context: BrowserContext, sender_keyword: str) -> Optional[str]:
        """
        Opens a new tab, checks Gmail for the latest code from sender, and returns it.
        """
        page = await context.new_page()
        try:
            logger.info("Opening Gmail in new tab for verification...")
            await page.goto("https://mail.google.com/", wait_until="networkidle")
            
            # Simple check if logged in
            if " accoun" in await page.title() or "Sign in" in await page.title():
                logger.error("Gmail not logged in. Please ensure auth state is valid.")
                return None

            logger.info(f"Scanning for email from: {sender_keyword}")
            
            # Strategy: Search for the email to filter the view
            search_box = page.get_by_placeholder("Search mail", exact=False)
            if await search_box.count() > 0:
                await search_box.fill(f"label:unread from:{sender_keyword}")
                await search_box.press("Enter")
                await page.wait_for_timeout(2000) # Wait for search results
            
            # Click the first email in the list
            try:
                # Common Gmail structure: table role="grid" -> tbody -> tr (row)
                email_row = page.locator('table[role="grid"] tbody tr').first
                if await email_row.count() > 0:
                    await email_row.click()
                else:
                    logger.warning("No emails found after search.")
                    return None
            except Exception as e:
                logger.warning(f"Could not click email row: {e}")
                return None
            
            await page.wait_for_timeout(2000) # Wait for email to open
            
            # Extract content
            content = await page.content()
            
            # Regex for 6-digit code
            match = re.search(r'\\b\\d{6}\\b', content)
            if match:
                code = match.group(0)
                logger.info(f"Found verification code: {code}")
                return code
            else:
                logger.warning("No 6-digit code found in email content.")
                return None
                
        except Exception as e:
            logger.error(f"Gmail automation failed: {e}")
            return None
        finally:
            logger.info("Closing Gmail tab.")
            await page.close()
