"""Job application API endpoints."""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user.user import User
from app.constants.constants import ApplicationStatus as JobApplicationStatus
from app.repositories.job.application_repository import ApplicationRepository
from app.schemas.job.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
    ApplicationStatusUpdate,
    ApplicationStats,
)
from app.schemas.job.bulk_apply import BulkApplyRequest
# from app.worker import celery_bulk_apply
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=List[ApplicationResponse])
async def get_user_applications(
    status: Optional[JobApplicationStatus] = Query(None, description="Filter by status"),
    limit: int = Query(100, ge=1, le=500, description="Limit results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all applications for the current user."""
    repo = ApplicationRepository(db)
    applications = await repo.get_user_applications(
        user_id=current_user.id,
        status=status,
        limit=limit,
        offset=offset
    )
    return applications


@router.get("/stats", response_model=ApplicationStats)
async def get_application_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get application statistics for the current user."""
    repo = ApplicationRepository(db)
    stats = await repo.get_stats(user_id=current_user.id)
    return stats


@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific application by ID."""
    repo = ApplicationRepository(db)
    application = await repo.get(application_id)
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Ensure user owns this application
    if application.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this application"
        )
    
    return application


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    application_data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new job application."""
    repo = ApplicationRepository(db)
    
    # Check if application already exists
    existing = await repo.get_by_user_and_job(
        user_id=current_user.id,
        job_id=application_data.job_id
    )
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied to this job"
        )
    
    application = await repo.create(
        user_id=current_user.id,
        application_data=application_data
    )
    return application


@router.put("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: UUID,
    update_data: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an application."""
    repo = ApplicationRepository(db)
    
    # Get existing application
    application = await repo.get(application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Ensure user owns this application
    if application.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this application"
        )
    
    updated_application = await repo.update(application_id, update_data)
    return updated_application


@router.patch("/{application_id}/status", response_model=ApplicationResponse)
async def update_application_status(
    application_id: UUID,
    status_update: ApplicationStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update application status."""
    repo = ApplicationRepository(db)
    
    # Get existing application
    application = await repo.get(application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Ensure user owns this application
    if application.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this application"
        )
    
    updated_application = await repo.update_status(application_id, status_update.status)
    return updated_application


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an application."""
    repo = ApplicationRepository(db)
    
    # Get existing application
    application = await repo.get(application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Ensure user owns this application
    if application.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this application"
        )
    
    await repo.delete(application_id)
    return None

@router.post("/auto-apply", status_code=status.HTTP_202_ACCEPTED)
async def bulk_auto_apply(
    request: BulkApplyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger autonomous bulk application process via Celery.
    Jobs are processed in the background worker with human-like throttling.
    """
    # 1. Validate ownership (optional but recommended)
    
    # 2. Enqueue Task in Celery
    # task = celery_bulk_apply.delay(
    #     user_id=str(current_user.id),
    #     job_ids=[str(jid) for jid in request.job_ids],
    #     base_resume_id=str(request.base_resume_id)
    # )
    
    # return {"message": "Bulk application process started", "task_id": str(task.id), "job_count": len(request.job_ids)}
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Auto-apply logic moved to external agent. Please use the agent directly.")
