"""API endpoints for job management and automated applications."""

import logging
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_active_user, get_job_service
from app.models.user.user import User
from app.repositories.job.job_repository import JobRepository
from app.repositories.job.application_repository import ApplicationRepository
from app.services.job.job import JobService
from app.tasks.automation_tasks import run_job_application_task
from app.schemas.job.job import JobResponse, BulkJobResponse, JobDetailAnalysis
from app.constants.constants import ApplicationMethod

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("", response_model=BulkJobResponse)
async def list_jobs(
    limit: int = 50,
    offset: int = 0,
    job_service: JobService = Depends(get_job_service),
    current_user: User = Depends(get_current_active_user)
):
    """List available jobs (Cached)."""
    return await job_service.get_public_jobs(limit=limit, offset=offset, user_id=current_user.id)

@router.get("/{job_id}", response_model=JobDetailAnalysis)
async def get_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get job details with user context."""
    logger.info(f"API: Fetching job details for job_id={job_id} user_id={current_user.id}")
    
    try:
        job_repo = JobRepository(db)
        
        # We fetch the job loaded with the current user's junction state
        logger.debug(f"Calling JobRepository.get_with_user_context for job_id={job_id}")
        job = await job_repo.get_with_user_context(job_id, current_user.id)
        
        if not job:
            logger.warning(f"Job not found: job_id={job_id}")
            raise HTTPException(status_code=404, detail="Job not found")
        
        logger.debug(f"Job found: {job.id}. preparing response.")
        
        # Pydantic validation will now find `user_scrapped_assoc` populated for this user
        response = JobDetailAnalysis.model_validate(job)
        logger.info(f"Successfully prepared job details response for job_id={job_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job details: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error while fetching job details.")

@router.post("/{job_id}/apply", status_code=status.HTTP_202_ACCEPTED)
async def apply_to_job(
    job_id: UUID,
    background_tasks: BackgroundTasks,
    method: ApplicationMethod = ApplicationMethod.AUTO,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Trigger an automated job application for a given job.
    Checks application status to prevent duplicates and race conditions.
    """
    try:
        from app.constants.constants import ApplicationStatus
        from app.models.job.user_job_map import UserJobMap
        from sqlalchemy import select
        
        job_repo = JobRepository(db)
        app_repo = ApplicationRepository(db)
        
        # 1. Check if job exists
        job = await job_repo.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # 2. Check user_job_map for application status
        stmt = select(UserJobMap).where(
            UserJobMap.user_id == current_user.id,
            UserJobMap.job_id == job_id
        )
        result = await db.execute(stmt)
        user_job = result.scalars().first()
        
        if user_job:
            # Check current status
            if user_job.application_status == ApplicationStatus.IN_PROGRESS:
                raise HTTPException(
                    status_code=409,
                    detail="Application already in progress for this job"
                )
            elif user_job.application_status == ApplicationStatus.APPLIED:
                raise HTTPException(
                    status_code=409,
                    detail="You have already applied to this job"
                )
            # NOT_APPLIED (0) and FAILED (3) are allowed to proceed
            
            # Update status to IN_PROGRESS
            user_job.application_status = ApplicationStatus.IN_PROGRESS
            await db.commit()
        else:
            # Job not in user's list yet, create entry with IN_PROGRESS
            new_user_job = UserJobMap(
                user_id=current_user.id,
                job_id=job_id,
                application_status=ApplicationStatus.IN_PROGRESS
            )
            db.add(new_user_job)
            await db.commit()
            
        # 3. Create Application Record
        application = await app_repo.create_application(
            job_id=job_id,
            user_id=current_user.id,
            preferred_method=method,
            notes=f"Automated application ({method.value}) triggered via API"
        )
        await db.commit()
        
        # 4. Trigger Background Task
        background_tasks.add_task(run_job_application_task, application.id)
        
        return {
            "message": "Automated application started",
            "application_id": str(application.id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to trigger application: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initiate automated application"
        )

@router.patch("/{job_id}/status")
async def update_job_application_status(
    job_id: UUID,
    application_status: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update application status for a job."""
    from app.models.job.user_job_map import UserJobMap
    from app.constants.constants import ApplicationStatus
    from sqlalchemy import select
    from datetime import datetime
    
    # Find user_job_map entry
    stmt = select(UserJobMap).where(
        UserJobMap.user_id == current_user.id,
        UserJobMap.job_id == job_id
    )
    result = await db.execute(stmt)
    user_job = result.scalars().first()
    
    if not user_job:
        raise HTTPException(status_code=404, detail="Job not found in your list")
    
    # Update status
    user_job.application_status = application_status
    
    # If APPLIED, set timestamp
    if application_status == ApplicationStatus.APPLIED:
        user_job.applied_at = datetime.utcnow()
    
    await db.commit()
    
    return {
        "message": "Status updated successfully",
        "job_id": str(job_id),
        "status": application_status
    }

@router.post("/{job_id}/enrich", status_code=status.HTTP_202_ACCEPTED)
async def enrich_job_details(
    job_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Trigger deep scraping for a specific job to get full details.
    Rate limited to 20 jobs/hour per user.
    """
    try:
        from app.tasks.scraping_tasks import deep_scrape_job_task
        
        job_repo = JobRepository(db)
        
        # Check if job exists
        job = await job_repo.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Check if job already has full details
        if job.description and len(job.description) > 500:
            return {
                "message": "Job already has detailed information",
                "job_id": str(job_id)
            }
        
        # Trigger background deep scraping task
        background_tasks.add_task(deep_scrape_job_task, job_id, current_user.id)
        
        return {
            "message": "Deep scraping initiated (3-5 min delay)",
            "job_id": str(job_id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to trigger deep scraping: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initiate deep scraping"
        )

