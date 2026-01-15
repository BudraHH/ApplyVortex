
"""
Script to generate Gmail Auth File (gmail_auth.json)
Run this script to open a browser, log in to Gmail manually, and save the session state.
"""
import asyncio
import os
from playwright.async_api import async_playwright

AUTH_FILE = "gmail_auth.json"

async def generate_auth():
    print("--- Gmail Auth Generator ---")
    print("1. A browser window will open.")
    print("2. Log in to your Gmail account manually.")
    print("3. Once you see your Inbox, come back here and press ENTER.")
    
    async with async_playwright() as p:
        # Launch with stealth arguments to avoid "This browser is not secure"
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
        
        # Stealth Evasion: Remove 'navigator.webdriver' property
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        """)
        
        page = await context.new_page()
        
        print("\nOpening Gmail...")
        await page.goto("https://mail.google.com/")
        
        # Wait for user to complete login
        input("\n>>> Press ENTER after you have successfully logged in and can see your Inbox <<<")
        
        # Save storage state
        await context.storage_state(path=AUTH_FILE)
        print(f"\nSUCCESS! Auth saved to: {os.path.abspath(AUTH_FILE)}")
        print("You can now run the agent with Universal Applier features.")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(generate_auth())
