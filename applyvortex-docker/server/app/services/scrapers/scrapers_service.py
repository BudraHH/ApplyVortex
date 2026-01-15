"""Unified scraper service for job portal scraping."""

import logging
from uuid import UUID

from app.services.job.job import JobService

from app.services.job.match_service import JobMatchingService
from app.repositories.agent_task_repository import AgentTaskRepository
from app.repositories.job.blueprint_repository import BlueprintRepository
from app.constants.constants import AgentTaskType, ExperienceLevel, JobType, WorkMode
from typing import Optional, List, Union

logger = logging.getLogger(__name__)

class ScraperService:
    """Orchestrates job scraping by delegating to Agent Forge."""
    
    def __init__(
        self, 
        job_service: JobService,
        match_service: JobMatchingService,
        agent_task_repo: AgentTaskRepository,
        blueprint_repo: BlueprintRepository
    ):
        self.job_service = job_service
        self.match_service = match_service
        self.agent_task_repo = agent_task_repo
        self.blueprint_repo = blueprint_repo

    async def run_scrape(self, user_id: UUID, portal_slug: str, keywords: str, location: str, experience: str = None, job_type: str = None, work_mode: str = None, date_posted: str = None, min_salary: int = None, blueprint_id: UUID = None, task_type: int = AgentTaskType.SCRAPE):
        """Creates a scraping task for Agent Forge."""
        try:
            task_name = "AUTO_APPLY" if task_type == AgentTaskType.AUTO_APPLY else "SCRAPE"
            logger.info(f"Queuing {task_name} task for User {user_id} on {portal_slug}. Blueprint: {blueprint_id}")
            logger.debug(f"Task query parameters: keywords='{keywords}', location='{location}'")
            
            # ENFORCE BLUEPRINT FILTERS
            if blueprint_id:
                blueprint = await self.blueprint_repo.get(blueprint_id)
                if blueprint:
                    logger.info(f"Applying filters from Blueprint: {blueprint.name}")
                    
                    # 1. Override Lists (Keywords/Locations)
                    # If blueprint has them, we use them STRICTLY as per user request
                    if blueprint.keywords:
                        keywords = blueprint.keywords # List[str]
                    
                    if blueprint.locations:
                        location = blueprint.locations # List[str]
                        
                    # 2. Map & Override Filters
                    if blueprint.experience_level is not None:
                        experience = self._map_experience(blueprint.experience_level)
                        
                    if blueprint.job_type is not None:
                        job_type = self._map_job_type(blueprint.job_type)
                        
                    if blueprint.work_mode is not None:
                        work_mode = self._map_work_mode(blueprint.work_mode)
                    
                    if blueprint.date_posted:
                        date_posted = blueprint.date_posted
                        
            
            payload = {
                "portal": portal_slug,
                "keywords": keywords,
                "location": location,
                "experience": experience,
                "job_type": job_type,
                "work_mode": work_mode,
                "date_posted": date_posted,
                "min_salary": min_salary,
                "blueprint_id": str(blueprint_id) if blueprint_id else None
            }
            
            task = await self.agent_task_repo.create_task(
                user_id=user_id,
                task_type=task_type,
                payload=payload,
                blueprint_id=blueprint_id
            )
            
            logger.info(f"Successfully created Agent Task {task.id} (Type: {task_type}) for User {user_id}")
            return task
                
        except Exception as e:
            from sqlalchemy.exc import IntegrityError
            if isinstance(e, IntegrityError) and "idx_tasks_unique_blueprint_pending" in str(e):
                from fastapi import HTTPException, status
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A scraping task is already running or pending for this blueprint."
                )
            logger.error(f"ScraperService.run_scrape failed to queue task: {e}")
            raise

    def _map_experience(self, level_int: int) -> Optional[str]:
        """Maps DB Enum int to Agent string."""
        mapping = {
            ExperienceLevel.INTERN.value: "internship",
            ExperienceLevel.ENTRY_LEVEL.value: "entry_level",
            ExperienceLevel.JUNIOR.value: "associate",
            ExperienceLevel.MID_LEVEL.value: "mid_senior",
            ExperienceLevel.SENIOR.value: "mid_senior",
            ExperienceLevel.LEAD.value: "director",
            ExperienceLevel.ARCHITECT.value: "executive",
            ExperienceLevel.EXECUTIVE.value: "executive"
        }
        return mapping.get(level_int)

    def _map_job_type(self, type_int: int) -> Optional[str]:
        mapping = {
            JobType.FULL_TIME.value: "full_time",
            JobType.PART_TIME.value: "part_time",
            JobType.CONTRACT.value: "contract",
            JobType.INTERNSHIP.value: "internship",
            JobType.FREELANCE.value: "contract"
        }
        return mapping.get(type_int)

    def _map_work_mode(self, mode_int: int) -> Optional[str]:
        mapping = {
            WorkMode.ONSITE.value: "on_site",
            WorkMode.REMOTE.value: "remote",
            WorkMode.HYBRID.value: "hybrid"
        }
        return mapping.get(mode_int)
