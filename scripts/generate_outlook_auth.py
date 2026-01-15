
"""
Script to generate Outlook Auth File (outlook_auth.json)
Run this script to open a browser, log in to Outlook manually, and save the session state.
"""
import asyncio
import os
from playwright.async_api import async_playwright

AUTH_FILE = "outlook_auth.json"

async def generate_auth():
    print("--- Outlook Auth Generator ---")
    print("1. A browser window will open.")
    print("2. Log in to your Outlook/Hotmail/Live account manually.")
    print("3. Once you see your Inbox, come back here and press ENTER.")
    
    async with async_playwright() as p:
        # Launch with stealth arguments
        browser = await p.chromium.launch(
            headless=False,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-infobars',
                '--start-maximized'
            ],
            ignore_default_args=["--enable-automation"]
        )
        
        # Create context with realistic User Agent
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport=None
        )
        
        # Stealth Evasion
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        """)
        
        page = await context.new_page()
        
        print("\nOpening Outlook...")
        await page.goto("https://outlook.live.com/mail/0/")
        
        # Wait for user to complete login
        input("\n>>> Press ENTER after you have successfully logged in and can see your Inbox <<<")
        
        # Save storage state
        await context.storage_state(path=AUTH_FILE)
        print(f"\nSUCCESS! Auth saved to: {os.path.abspath(AUTH_FILE)}")
        print("You can now run the agent with Universal Applier features for Outlook.")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(generate_auth())
