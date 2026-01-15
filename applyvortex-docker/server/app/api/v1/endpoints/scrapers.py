from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.core.dependencies import get_db, get_scraper_service
from app.api.api_key_auth import get_authenticated_user
from app.core.config import settings

from app.services.scrapers.scrapers_service import ScraperService
from app.models.user.user import User
from app.constants.constants import AgentTaskType

router = APIRouter()

@router.post("/naukri")
async def scrape_naukri(
        keywords: str = "software engineer",
        location: str = "India",
        experience: str = None,
        job_type: str = None,
        work_mode: str = None,
        date_posted: str = None,
        min_salary: int = None,
        blueprint_id: UUID = None,
        task_type: int = AgentTaskType.SCRAPE,
        current_user: User = Depends(get_authenticated_user),
        scraper_service: ScraperService = Depends(get_scraper_service)
):
    """Scrape Naukri jobs in background"""
    import logging
    logger = logging.getLogger(__name__)
    mode_name = "AUTONOMOUS (Auto Apply)" if task_type == AgentTaskType.AUTO_APPLY else "DISCOVERY (Find Jobs)"
    logger.info(f"Received Naukri request from User {current_user.id}. Mode: {mode_name} (TaskType: {task_type})")

    await scraper_service.run_scrape(
        current_user.id,
        "naukri",
        keywords,
        location,
        experience,
        job_type,
        work_mode,
        date_posted,
        min_salary,
        blueprint_id,
        task_type
    )
    return {"message": "Naukri scraping started", "portal": "naukri"}

@router.post("/linkedin")
async def scrape_linkedin(
        keywords: str = "fullstack developer",
        location: str = "India",
        experience: str = None,
        job_type: str = None,
        work_mode: str = None,
        date_posted: str = None,
        blueprint_id: UUID = None,
        task_type: int = AgentTaskType.SCRAPE,
        current_user: User = Depends(get_authenticated_user),
        scraper_service: ScraperService = Depends(get_scraper_service)
):
    """Scrape LinkedIn jobs in background"""
    import logging
    logger = logging.getLogger(__name__)
    mode_name = "AUTONOMOUS (Auto Apply)" if task_type == AgentTaskType.AUTO_APPLY else "DISCOVERY (Find Jobs)"
    logger.info(f"Received LinkedIn request from User {current_user.id}. Mode: {mode_name} (TaskType: {task_type})")

    await scraper_service.run_scrape(
        current_user.id,
        "linkedin",
        keywords,
        location,
        experience,
        job_type,
        work_mode,
        date_posted,
        None,
        blueprint_id,
        task_type
    )
    return {"message": "LinkedIn scraping started", "portal": "linkedin"}

    return {"message": "LinkedIn scraping started", "portal": "linkedin"}

@router.get("/status/{scrape_id}")
async def get_scrape_status(
        scrape_id: str,
        current_user: User = Depends(get_authenticated_user)
):
    """Check scraping progress"""
    return {
        "scrape_id": scrape_id,
        "status": "running",
        "message": "Scraping is active in background"
    }
