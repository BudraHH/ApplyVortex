from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from pydantic import BaseModel

from app.core.dependencies import get_db, get_current_user, get_current_active_user
from app.services.profile.resume_service import ResumeService
from app.services.profile.tailor_service import ResumeTailorService
from app.services.storage.resume_storage import storage_service
from app.services.storage.resume_storage import storage_service
# REMOVED: from app.tasks.resume_tasks import parse_resume_task (Moving to Agent)
from app.models.user.user import User
from app.models.agent_forge_task import AgentForgeTask
from app.constants.constants import AgentTaskType, TaskStatus
from app.schemas.user.resume import ResumeResponse, BulkResumeResponse
from app.services.cache.redis_service import redis_service, cached
import logging
import hashlib

logger = logging.getLogger(__name__)
router = APIRouter()

# ============================================
# REQUEST/RESPONSE SCHEMAS
# ============================================

class UploadUrlRequest(BaseModel):
    file_name: str
    file_type: str = "application/pdf"

class UploadUrlResponse(BaseModel):
    upload_url: str
    file_key: str

class CreateResumeRequest(BaseModel):
    file_key: str
    file_name: str
    file_size: int
    file_format: str
    is_default: bool = False

class TailorResumeRequest(BaseModel):
    job_description: str
    job_id: Optional[UUID] = None
    optimized_content: Optional[dict] = None


class DownloadUrlResponse(BaseModel):
    download_url: str
    expires_in: int = 3600

# ============================================
# ENDPOINTS
# ============================================

@router.post("/upload-url", response_model=UploadUrlResponse)
async def get_upload_url(
    request: UploadUrlRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate presigned URL for direct R2 upload.
    Frontend will use this URL to upload the file directly to R2.
    """
    try:
        # Generate unique file key
        import hashlib
        import time
        unique_id = hashlib.md5(f"{current_user.id}{request.file_name}{time.time()}".encode()).hexdigest()[:8]
        file_extension = request.file_name.split('.')[-1] if '.' in request.file_name else 'pdf'
        file_key = f"resumes/{current_user.id}/{unique_id}.{file_extension}"
        
        # Generate presigned URL
        presigned_url = storage_service.create_presigned_upload(file_key, request.file_type)
        
        return UploadUrlResponse(
            upload_url=presigned_url,
            file_key=file_key
        )
    except Exception as e:
        logger.error(f"Error generating upload URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate upload URL"
        )

@router.post("", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def create_resume(
    request: CreateResumeRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create resume record after successful R2 upload.
    """
    try:
        # Optional: Check if file exists (with warning only)
        try:
            if not storage_service.file_exists(request.file_key):
                logger.warning(f"File not immediately found in R2: {request.file_key}")
        except Exception as e:
            logger.warning(f"Error checking file existence: {e}")
        
        # Create resume record
        resume_service = ResumeService(db)
        resume_response = await resume_service.create_from_r2(
            user_id=current_user.id,
            file_key=request.file_key,
            file_name=request.file_name,
            file_size=request.file_size,
            file_format=request.file_format,
            is_default=request.is_default
        )
        
        # Trigger Agent Task instead of Server-Side Parsing
        try:
            # Generate a temporary download URL for the agent to fetch the resume
            # Accesses R2 to get a presigned URL valid for 1 hour
            download_url = storage_service.create_presigned_view(request.file_key)
            
            new_task = AgentForgeTask(
                user_id=current_user.id,
                task_type=AgentTaskType.PARSE_RESUME.value,
                status=TaskStatus.PENDING.value,
                payload={
                    "resume_id": str(resume_response.id),
                    "file_url": download_url,
                    "file_key": request.file_key # Sent for reference
                }
            )
            db.add(new_task)
            await db.commit()
            
            logger.info(f"Created Agent PARSE_RESUME task for resume {resume_response.id}")
            
        except Exception as queue_e:
            logger.error(f"Failed to queue agent task: {queue_e}")
            # If agent task creation fails, user still has the file, but it won't be parsed automatically.
        
        # Invalidate cache for this user
        await redis_service.delete(f"cache:user:{current_user.id}:resumes")
        
        return resume_response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating resume: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create resume"
        )

@router.get("", response_model=BulkResumeResponse)
@cached(ttl_seconds=300, key_builder=lambda f, *args, **kwargs: f"cache:user:{kwargs.get('current_user', args[1] if len(args)>1 else None).id}:resumes", response_model=BulkResumeResponse)
async def list_resumes(
    active_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all user resumes"""
    try:
        resume_service = ResumeService(db)
        # Note: The service likely returns a list or an object matching BulkResumeResponse. 
        # Caching will serialize this result.
        resumes = await resume_service.get_all(current_user.id, active_only)
        
        # If resumes is a list, we might need to wrap it if BulkResumeResponse expects dict
        # Assuming service returns correct shape or Pydantic model
        return resumes
    except Exception as e:
        logger.error(f"Error listing resumes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve resumes"
        )

@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get single resume by ID"""
    try:
        resume_service = ResumeService(db)
        resume = await resume_service.get_by_id(resume_id, current_user.id)
        
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found"
            )
        
        return resume
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting resume: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve resume"
        )

@router.get("/{resume_id}/download-url", response_model=DownloadUrlResponse)
async def get_download_url(
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get presigned download URL for resume"""
    try:
        resume_service = ResumeService(db)
        resume = await resume_service.get_by_id(resume_id, current_user.id)
        
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found"
            )
        
        # FIX: Use file_url directly as file_key (it already contains the full path)
        file_key = resume.file_url
        
        # Generate presigned download URL
        download_url = storage_service.create_presigned_view(file_key)
        
        return DownloadUrlResponse(
            download_url=download_url,
            expires_in=3600
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating download URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate download URL"
        )

@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete resume and file from R2"""
    try:
        resume_service = ResumeService(db)
        await resume_service.delete_resume(resume_id, current_user.id)
        
        # Invalidate cache
        await redis_service.delete(f"cache:user:{current_user.id}:resumes")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting resume: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete resume"
        )

@router.put("/{resume_id}/default", response_model=ResumeResponse)
async def set_default_resume(
    resume_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Set resume as default for applications"""
    try:
        resume_service = ResumeService(db)
        resume_service = ResumeService(db)
        resume = await resume_service.set_default_resume(resume_id, current_user.id)
        
        # Invalidate cache
        await redis_service.delete(f"cache:user:{current_user.id}:resumes")
        
        return resume
    except Exception as e:
        logger.error(f"Error setting default resume: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to set default resume"
        )

@router.post("/{resume_id}/tailor", response_model=ResumeResponse)
async def tailor_resume(
    resume_id: UUID,
    request: TailorResumeRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a tailored version of a base resume for a specific job.
    """
    try:
        tailor_service = ResumeTailorService(db)
        tailored_resume = await tailor_service.tailor_resume(
            user_id=current_user.id,
            base_resume_id=resume_id,
            job_description=request.job_description,
            job_id=request.job_id,
            optimized_content=request.optimized_content
        )
        return tailored_resume
    except Exception as e:
        logger.error(f"Error tailoring resume: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to tailor resume: {str(e)}"
        )
