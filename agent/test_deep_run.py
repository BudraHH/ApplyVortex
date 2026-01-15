import asyncio
import logging
import sys
import os

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agent.core.browser_service import browser_service
from agent.scrapers.linkedin_deep_scraper import deep_scraper

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s'
)
logger = logging.getLogger(__name__)

# --- MONKEY PATCH DELAY ---
# Override the massive 3-5 minute delay for test purposes
async def no_delay(self, min_s=0, max_s=0):
    pass
# deep_scraper._human_delay = no_delay  # If it had that method
# But the delay is inline. We can't easily patch inline code.
# Instead, we will subclass or modify the method on the instance if possible?
# Actually, the easiest way is to edit the file temporarily or wait.
# Wait, I can't edit inline logic.
# I will edit the source file `linkedin_deep_scraper.py` to reduce the delay for now.


async def test_deep_scrape():
    # A real, active job URL (ideally one recently scraped or a stable one)
    # Using a generic search URL or specific job. 
    # Let's try to scrape a random job from a search first to get a valid URL, 
    # OR use a hardcoded URL if you have one.
    # For now, I'll search for one job to get a fresh URL, then deep scrape it.
    
    print(">>> Initializing Browser...")
    await browser_service.initialize(headless=True) # Use headless for speed, or False to watch
    
    try:
        # Step 1: Get a fresh Job URL (Quick Search)
        print(">>> Getting a fresh job URL from search...")
        context, page = await browser_service.create_session()
        await page.goto("https://www.linkedin.com/jobs/search/?keywords=Software%20Engineer&location=India&f_TPR=r86400")
        await page.wait_for_selector(".job-search-card")
        
        # Grab first job link
        link_el = await page.query_selector("a.base-card__full-link")
        if not link_el:
             link_el = await page.query_selector("a.job-card-container__link")
        
        if not link_el:
            print("❌ Could not find a job card to test with.")
            return

        job_url = await link_el.get_attribute("href")
        print(f">>> Found Job URL: {job_url}")
        
        await browser_service.browser_manager.close_context(context)

        # Step 2: Deep Scrape It
        print("\n>>> STARTING DEEP SCRAPE TEST...")
        result = await deep_scraper.scrape_job_details(job_url)
        
        print("\n" + "="*50)
        print("SCRAPE RESULTS:")
        print("="*50)
        for k, v in result.items():
            val_preview = str(v)[:100] + "..." if isinstance(v, str) and len(v) > 100 else v
            print(f"{k}: {val_preview}")
            
        print("-" * 30)
        
        # Validation Check
        desc_len = len(result.get('description', ''))
        print(f"\n✅ Final Description Length: {desc_len}")
        if desc_len > 1000:
             print("SUCCESS: Description is long enough (likely expanded).")
        else:
             print("WARNING: Description seems short (condensed?).")
             
        if result.get('description_expanded'):
             print("SUCCESS: Expansion flag is TRUE.")

    except Exception as e:
        logger.error(f"Test failed: {e}", exc_info=True)
    finally:
        await browser_service.cleanup()

if __name__ == "__main__":
    asyncio.run(test_deep_scrape())
