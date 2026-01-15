"""
Outlook Provider Implementation
"""
import logging
import re
from typing import Optional
from playwright.async_api import BrowserContext

from .base import EmailProvider

logger = logging.getLogger(__name__)

class OutlookProvider(EmailProvider):
    """
    Automates Outlook interactions using Playwright.
    Requires the browser context to have valid Outlook session/cookies.
    """
    
    async def get_latest_verification_code(self, context: BrowserContext, sender_keyword: str) -> Optional[str]:
        """
        Opens a new tab, checks Outlook for the latest code from sender, and returns it.
        """
        page = await context.new_page()
        try:
            logger.info("Opening Outlook in new tab for verification...")
            await page.goto("https://outlook.live.com/mail/0/", wait_until="networkidle")
            
            # Simple check if logged in
            if "Sign in" in await page.title():
                logger.error("Outlook not logged in. Please ensure auth state is valid.")
                return None

            logger.info(f"Scanning for email from: {sender_keyword}")
            
            # Search approach for Outlook
            # Using generic search bar locator
            search_box = page.get_by_placeholder("Search", exact=False)
            if await search_box.count() > 0:
                await search_box.fill(f"from:{sender_keyword}")
                await search_box.press("Enter")
                await page.wait_for_timeout(3000) # Wait for search results
            
            # Click the first email in the list
            try:
                # Outlook's message list is complex. We try to click the first "message list item"
                # Often has role="option" or is in a listbox with role="grid"
                # Strategy: Click the area that looks like the first result
                # Outlook often uses div[role="option"] for email items in the list
                email_item = page.locator('div[role="option"]').first
                
                if await email_item.count() > 0:
                    await email_item.click()
                else:
                    # Fallback generic click on first item in potential list container
                    await page.click('div[aria-label="Message list"] > div > div:first-child')
                    
            except Exception as e:
                logger.warning(f"Could not click email item: {e}")
                return None
            
            await page.wait_for_timeout(2000) # Wait for reading pane
            
            # Extract content (Reading Pane)
            # We just grab the whole page text content or reading pane content
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
            logger.error(f"Outlook automation failed: {e}")
            return None
        finally:
            logger.info("Closing Outlook tab.")
            await page.close()
