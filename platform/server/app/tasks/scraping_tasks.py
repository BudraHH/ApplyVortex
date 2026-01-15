"""Celery tasks for deep job scraping with rate limiting."""

import logging
from uuid import UUID
from celery import shared_task
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_maker
from app.repositories.job.job_repository import JobRepository

logger = logging.getLogger(__name__)


@shared_task(name="deep_scrape_job_task")
def deep_scrape_job_task(job_id: str, user_id: str):
    """
    Celery task to trigger deep scraping for a specific job.
    This creates an agent task that the agent will pick up.
    """
    import asyncio
    
    async def _execute():
        async with async_session_maker() as session:
            try:
                from app.repositories.agent_task_repository import AgentTaskRepository
                from app.constants.constants import AgentTaskType, Portal
                
                jid = UUID(job_id) if isinstance(job_id, str) else job_id
                uid = UUID(user_id) if isinstance(user_id, str) else user_id

                task_repo = AgentTaskRepository(session)
                job_repo = JobRepository(session)
                
                # Get job details
                job = await job_repo.get(jid)
                if not job:
                    logger.error(f"Job {job_id} not found for deep scraping")
                    return
                
                # Resolve portal identity
                portal_slug = "linkedin" # Default
                try:
                    portal_slug = Portal(job.portal).name.lower()
                except:
                    pass

                task_data = {
                    "job_id": str(jid),
                    "job_url": job.job_post_url,
                    "portal": portal_slug,
                    "action": "deep_scrape"
                }
                
                agent_task = await task_repo.create_task(
                    user_id=uid,
                    task_type=AgentTaskType.AUTO_APPLY.value,
                    payload=task_data
                )
                
                await session.commit()
                logger.info(f"Created deep scrape task {agent_task.id} for job {job_id}")
                
            except Exception as e:
                logger.error(f"Error creating deep scrape task: {e}", exc_info=True)
    
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    loop.run_until_complete(_execute())
