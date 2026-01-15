
"""
Test script to verify Gmail Access using the generated auth file.
This checks if the agent can open Gmail without login prompts.
"""
import asyncio
import os
import sys

# Ensure agent is in path
sys.path.append(os.getcwd())

from playwright.async_api import async_playwright
from agent.services.gmail_browser import gmail_service

AUTH_FILE = "gmail_auth.json"

async def test_gmail_access():
    print(f"Testing Gmail Access using {AUTH_FILE}...")
    
    if not os.path.exists(AUTH_FILE):
        print("ERROR: Auth file not found!")
        return

    async with async_playwright() as p:
        # Launch headed to see it work
        browser = await p.chromium.launch(headless=False)
        
        # Load context with auth
        context = await browser.new_context(storage_state=AUTH_FILE)
        
        # Try to read "latest code" (will likely fail to find one, but we check for login)
        print("Attempting to open Gmail tab...")
        
        # We start a dummy page because the service expects context.new_page() inside
        # Actually the service creates its own page from context.
        
        # Let's just run the service method
        code = await gmail_service.get_latest_verification_code(context, sender_keyword="TestKeywordCheck")
        
        print("\n--- Test Finished ---")
        if code is None:
            print("Note: returned None (expected if no email matches).")
        else:
            print(f"Returned code: {code}")
            
        print("Check the browser window: Did it show the Inbox? If yes, SUCCESS.")
        await asyncio.sleep(5) # Give time to look
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_gmail_access())
