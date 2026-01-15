import asyncio
import logging
import sys
import os

# Add current directory to sys.path
sys.path.append(os.getcwd())

from scrapers.naukri import NaukriScraper

logging.basicConfig(level=logging.INFO)

async def main():
    print("Starting Naukri Internship Scraper Test...")
    scraper = NaukriScraper()
    keywords = ["software", "developer"]
    location = "Bengaluru"
    job_type = "internship"
    
    print(f"Scraping for: {keywords} | Location: {location} | Type: {job_type}")
    
    # Passing the new job_type parameter
    jobs = await scraper.scrape(keywords, location, limit=5, job_type=job_type)
    
    print("-" * 30)
    print(f"Total Jobs Found: {len(jobs)}")
    for job in jobs:
        print(f"Title: {job.get('title')}")
        print(f"Company: {job.get('company')}")
        print(f"Location: {job.get('location')}")
        print(f"URL: {job.get('job_url')}")
        print("-" * 10)

if __name__ == "__main__":
    asyncio.run(main())
