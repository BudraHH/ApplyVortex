from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user.resume_repository import ResumeRepository
from app.schemas.user.resume import (
    BulkResumeCreate, 
    BulkResumeResponse, 
    ResumeResponse, 
    ResumeUpload
)
from app.core.exceptions import UserNotFound
from app.core.config import settings
from app.services.storage.resume_storage import storage_service
from app.models.user.resume import UserResume
from app.services.cache.redis_service import redis_service, cached
from app.constants.constants import ParsingStatus, ResumeType, ResumeFileFormat
import hashlib
import logging

logger = logging.getLogger(__name__)


class ResumeService:
    def __init__(self, db: AsyncSession = None, resume_repo: ResumeRepository = None):
        self.db = db
        self.resume_repo = resume_repo or ResumeRepository(db)
    
    async def replace_all(self, user_id: UUID, data: BulkResumeCreate) -> BulkResumeResponse:
        """Replace ALL resumes (rarely used - mostly single upload)"""
        resumes = await self.resume_repo.replace_all(user_id, data.resumes)
        await self.db.commit()
        
        await redis_service.delete_pattern(f"cache:user:{user_id}:resumes*")
        
        return BulkResumeResponse(
            resumes=ResumeResponse.model_validate(resumes[0]) if resumes else None
        )
    
    @cached(ttl_seconds=3600, key_builder=lambda f, self, user_id, active_only=True: f"cache:user:{user_id}:resumes:{active_only}", response_model=BulkResumeResponse)
    async def get_all(self, user_id: UUID, active_only: bool = True) -> BulkResumeResponse:
        """Get ALL user resumes (prioritize default + recent)"""
        resumes = await self.resume_repo.get_by_user_id(user_id, active_only)
        if not resumes:
            return BulkResumeResponse(resumes=None)
            
        # Return the first resume
        return BulkResumeResponse(
            resumes=ResumeResponse.model_validate(resumes[0])
        )
    
    async def get_default_resume(self, user_id: UUID) -> ResumeResponse:
        """Get user's default resume for job applications"""
        resume = await self.resume_repo.get_default_resume(user_id)
        if not resume:
            raise UserNotFound("No default resume found")
        return ResumeResponse.model_validate(resume)
    
    async def upload_resume(
        self, 
        user_id: UUID, 
        file_data: ResumeUpload, 
        file_content: bytes, 
        is_default: bool = False
    ) -> ResumeResponse:
        """Upload new resume (S3 + parsing trigger)"""
        # Generate file hash for deduplication
        file_hash = hashlib.md5(file_content).hexdigest()
        
        # Check if duplicate exists
        existing = await self.resume_repo.get_by(file_hash=file_hash, user_id=user_id)
        if existing:
            return ResumeResponse.model_validate(existing)
        
        resume_data = {
            'title': file_data.file_name,
            'file_url': f"s3://{settings.S3_RESUME_PREFIX}/{user_id}/{file_hash}",
            'file_name': file_data.file_name,
            'file_format': file_data.file_format,
            'file_size_bytes': file_data.file_size_bytes,
            'file_hash': file_hash,
            'is_default': is_default
        }
        
        resume = await self.resume_repo.create(UserResume(**resume_data, user_id=user_id))
        
        # Set as default if requested
        if is_default:
            await self.resume_repo.set_default_resume(resume.id, user_id)
        
        await redis_service.delete_pattern(f"cache:user:{user_id}:resumes*")
        
        return ResumeResponse.model_validate(resume)
    
    async def set_default_resume(self, resume_id: UUID, user_id: UUID) -> ResumeResponse:
        """Set specific resume as default for applications"""
        resume = await self.resume_repo.set_default_resume(resume_id, user_id)
        await self.db.commit()
        
        await redis_service.delete_pattern(f"cache:user:{user_id}:resumes*")
        
        return ResumeResponse.model_validate(resume)
    
    async def create_from_r2(
        self,
        user_id: UUID,
        file_key: str,
        file_name: str,
        file_size: int,
        file_format: str,
        is_default: bool = False
    ) -> ResumeResponse:
        """Create resume record from R2 upload"""
        try:
            # Generate file hash from file key
            file_hash = hashlib.md5(file_key.encode()).hexdigest()
            
            # Convert file_format string to int if necessary
            format_val = file_format
            if isinstance(file_format, str):
                try:
                    format_val = ResumeFileFormat[file_format.upper()].value
                except KeyError:
                    format_val = ResumeFileFormat.PDF.value
            
            # Create resume data
            resume_data = {
                'user_id': user_id,
                'title': file_name,
                'file_url': file_key,  # Store R2 file key
                'file_name': file_name,
                'file_format': format_val,
                'file_size_bytes': file_size,
                'file_hash': file_hash,
                'is_default': is_default,
                'parsing_status': ParsingStatus.PENDING.value,
                'resume_type': ResumeType.BASE.value  # Explicitly set as Base resume
            }
            
            # CRITICAL: Enforce "One Base Resume" rule
            # Delete any existing base resume to avoid unique constraint violation
            existing_base = await self.resume_repo.get_by(user_id=user_id, resume_type=ResumeType.BASE.value)
            if existing_base:
                logger.info(f"Replacing existing base resume {existing_base.id} for user {user_id}")
                await self.delete_resume(existing_base.id, user_id)
            
            # Create resume record
            resume = UserResume(**resume_data)
            created_resume = await self.resume_repo.create(resume)
            
            # Set as default if requested
            if is_default:
                await self.resume_repo.set_default_resume(created_resume.id, user_id)
            
            await redis_service.delete_pattern(f"cache:user:{user_id}:resumes*")
            
            logger.info(f"Created resume record: {created_resume.id} for user: {user_id}")
            return ResumeResponse.model_validate(created_resume)
            
        except Exception as e:
            logger.error(f"Error creating resume from R2: {e}")
            raise
    
    async def get_by_id(self, resume_id: UUID, user_id: UUID) -> Optional[ResumeResponse]:
        """Get resume by ID, ensuring it belongs to the user"""
        resume = await self.resume_repo.get(resume_id)
        
        if not resume or resume.user_id != user_id:
            return None
        
        return ResumeResponse.model_validate(resume)
    
    async def delete_resume(self, resume_id: UUID, user_id: UUID) -> bool:
        """Delete resume and remove file from R2"""
        try:
            # Get resume to verify ownership and get file key
            resume = await self.resume_repo.get(resume_id)
            
            if not resume or resume.user_id != user_id:
                raise UserNotFound("Resume not found")
            
            # Delete from R2
            try:
                storage_service.delete_file(resume.file_url)
                logger.info(f"Deleted file from R2: {resume.file_url}")
            except Exception as e:
                logger.warning(f"Failed to delete file from R2: {e}")
                # Continue with DB deletion even if R2 deletion fails
            
            # Delete from database
            await self.resume_repo.delete(resume_id)
            await self.db.commit()
            logger.info(f"Deleted resume record: {resume_id}")
            
            await redis_service.delete_pattern(f"cache:user:{user_id}:resumes*")
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting resume: {e}")
            raise
