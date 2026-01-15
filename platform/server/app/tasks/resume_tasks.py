"""Background tasks for resume processing."""

import logging
import asyncio
from uuid import UUID
from datetime import datetime

from app.db.session import async_session
from app.repositories.user.resume_repository import ResumeRepository
from app.services.storage.resume_storage import storage_service
from app.schemas.user.resume import ParsingStatus
from app.constants.constants import ParsingStatus as ParsingStatusEnum
from app.services.cache.redis_service import redis_service

logger = logging.getLogger(__name__)

from celery import shared_task

async def _parse_resume_task_impl(resume_id: UUID, file_key: str, file_format: str):
    """
    Internal async implementation of resume parsing.
    """
    start_time = datetime.utcnow()
    logger.info(f"[Resume {resume_id}] Starting background parsing task")
    
    try:
        from app.services.parser.resume_parser import resume_parser
    except Exception as ie:
        logger.error(f"[Resume {resume_id}] Failed to import resume_parser: {ie}")
        return

    async with async_session() as session:
        resume_repo = ResumeRepository(session)
        
        try:
            # 1. Update status to processing
            await resume_repo.update(resume_id, {
                "parsing_status": ParsingStatusEnum.PROCESSING.value,
                "parsing_started_at": start_time
            })
            await session.commit()
            
            # 2. Download from R2
            logger.info(f"[Resume {resume_id}] Downloading file from R2: {file_key}")
            file_content = storage_service.download_file(file_key)
            file_size_kb = len(file_content) / 1024
            logger.info(f"[Resume {resume_id}] Downloaded {file_size_kb:.2f} KB. File format: {file_format}")
            
            # 3. Parse with AI
            logger.info(f"[Resume {resume_id}] Sending content to AI Resume Parser...")
            parse_start = datetime.utcnow()
            
            # Add a 90-second timeout (increased for safety)
            parsed_data = await asyncio.wait_for(
                resume_parser.parse(file_content, file_key),
                timeout=90.0
            )
            parse_duration = (datetime.utcnow() - parse_start).total_seconds()
            logger.info(f"[Resume {resume_id}] AI Parse successful. Took {parse_duration:.2f}s. Keys found: {list(parsed_data.keys())}")
            
            # 4. Get metadata for sync
            resume = await resume_repo.get(resume_id)
            if not resume:
                raise Exception(f"Resume {resume_id} not found")

            # 5. Sync parsed data to Profile tables
            from app.services.profile.resume_sync_service import ResumeSyncService
            sync_service = ResumeSyncService(session)
            
            # Pass resume_id for tracing
            sync_start = datetime.utcnow()
            await sync_service.sync_data(resume.user_id, parsed_data, resume_id=resume_id)
            sync_duration = (datetime.utcnow() - sync_start).total_seconds()
            logger.info(f"[Resume {resume_id}] DB Sync took {sync_duration:.2f}s")
            
            # 6. Update resume record with parsed data and status
            await resume_repo.update(resume_id, {
                "parsed_data": parsed_data,
                "parsing_status": ParsingStatusEnum.SUCCESS.value,
                "parsing_completed_at": datetime.utcnow()
            })
            
            await session.commit()
            
            # Invalidate cache
            await redis_service.delete(f"cache:user:{resume.user_id}:resumes")
            
            total_duration = (datetime.utcnow() - start_time).total_seconds()
            logger.info(f"[Resume {resume_id}] Successfully completed entire parsing pipeline in {total_duration:.2f}s")
            
        except asyncio.TimeoutError:
            error_msg = "AI Parsing timed out after 90 seconds"
            logger.error(f"[Resume {resume_id}] {error_msg}")
            
            # Handle Timeout specific cleanup
            try:
                await resume_repo.update(resume_id, {
                    "parsing_status": ParsingStatusEnum.FAILED.value,
                    "parsing_error": error_msg
                })
                await session.commit()
            except Exception: pass
            
            # Send notification
            await _send_failure_notification(session, resume_id, error_msg)

        except Exception as e:
            logger.error(f"[Resume {resume_id}] CRITICAL FAILURE: {type(e).__name__}: {e}")
            import traceback
            logger.error(f"[Resume {resume_id}] Traceback: {traceback.format_exc()}")
            
            try:
                await session.rollback()
            except Exception: pass

            try:
                await resume_repo.update(resume_id, {
                    "parsing_status": ParsingStatusEnum.FAILED.value,
                    "parsing_error": str(e)
                })
                await session.commit()
            except Exception: pass
                
            await _send_failure_notification(session, resume_id, str(e))

async def _send_failure_notification(session, resume_id: UUID, error_msg: str):
    """Helper to send failure notification safely."""
    try:
        from app.repositories.user.notification_repository import NotificationRepository
        from app.repositories.user.resume_repository import ResumeRepository
        from app.constants.constants import NotificationType
        
        resume_repo = ResumeRepository(session)
        resume = await resume_repo.get(resume_id)
        if resume:
            notification_repo = NotificationRepository(session)
            await notification_repo.create_notification(
                user_id=resume.user_id,
                type=NotificationType.SYSTEM.value,
                title="Resume Parsing Failed",
                message="Your resume could not be processed completely. Please try again.",
                action_url="/resume-upload",
                metadata={"resume_id": str(resume_id), "error": error_msg[:200]}
            )
            await session.commit()
    except Exception as e:
        logger.error(f"[Resume {resume_id}] Failed to send failure notification: {e}")

@shared_task
def parse_resume_task(resume_id: UUID, file_key: str, file_format: str):
    """
    Synchronous wrapper for background task to parse a resume using AI.
    """
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    loop.run_until_complete(_parse_resume_task_impl(resume_id, file_key, file_format))
