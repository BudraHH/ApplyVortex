from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.job.job_repository import JobRepository
from app.schemas.job.job import (
    BulkJobCreate, 
    BulkJobResponse, 
    JobCreate, 
    JobResponse,
    JobListItem
)
from app.core.exceptions import UserNotFound
from app.core.dependencies import get_db
from app.services.cache.redis_service import cached


class JobService:
    def __init__(self, db: AsyncSession = None, job_repo: JobRepository = None):
        self.db = db
        self.job_repo = job_repo or JobRepository(db)

    @cached(ttl_seconds=60)
    async def get_public_jobs(self, limit: int = 50, offset: int = 0, user_id: UUID = None) -> BulkJobResponse:
        """Get publicly available jobs with user context for application status"""
        if user_id:
            # Fetch jobs with user's application status
            jobs = await self.job_repo.get_jobs_with_user_context(user_id=user_id, limit=limit, offset=offset)
        else:
            # Fetch public jobs without user context
            jobs = await self.job_repo.get_multi(limit=limit, offset=offset)
        
        return BulkJobResponse(
            jobs=[JobListItem.model_validate(job) for job in jobs],
            total_count=len(jobs)
        )
    
    async def bulk_upsert(self, user_id: UUID, data: BulkJobCreate) -> BulkJobResponse:
        """Upsert jobs from scraping results, preserving existing entries."""
        await self.job_repo.bulk_upsert(user_id, [job.model_dump() for job in data.jobs])
        
        # Return the updated full list for the user
        return await self.get_user_jobs(user_id)
    
    async def bulk_upsert_enriched(self, user_id: UUID, jobs_enriched: List[dict]) -> None:
        """Upsert enriched jobs with AI match scores."""
        await self.job_repo.bulk_upsert_enriched(user_id, jobs_enriched)
    
    async def get_user_jobs(self, user_id: UUID) -> BulkJobResponse:
        """Get all saved jobs for user"""
        jobs = await self.job_repo.get_by_user_id(user_id)
        return BulkJobResponse(
            jobs=[JobResponse.model_validate(job) for job in jobs],
            total_count=len(jobs)
        )
    
    async def get_jobs_by_portal(self, user_id: UUID, portal: int) -> List[JobResponse]:
        """Get jobs from specific portal"""
        jobs = await self.job_repo.get_by_portal(user_id, portal)
        return [JobResponse.model_validate(job) for job in jobs]
    
    async def update_job_status(self, user_id: UUID, job_id: UUID, status: int) -> JobResponse:
        """Update job application status"""
        success = await self.job_repo.update_status(user_id, job_id, status)
        if not success:
            raise UserNotFound()
        
        # We fetch the job again to return the full response with corrected status
        jobs = await self.job_repo.get_by_user_id(user_id)
        target_job = next((j for j in jobs if j.id == job_id), None)
        if not target_job:
             raise UserNotFound()
             
        return JobResponse.model_validate(target_job)
    
    async def add_job(self, user_id: UUID, job_data: JobCreate) -> JobResponse:
        """Manually add single job"""
        data = job_data.model_dump()
        
        # Mapping logic
        if data.pop("is_easy_apply", False):
            data["application_method"] = 1 # EASY_APPLY
            
        job = Job(**data, user_id=user_id)
        created_job = await self.job_repo.create(job)
        return JobResponse.model_validate(created_job)
    
    async def delete_job(self, job_id: UUID, user_id: UUID) -> bool:
        """Delete specific job (remove user association)"""
        return await self.job_repo.delete_user_job(user_id, job_id)

    async def update_job_identifiers(self, job_id: UUID, job_post_url: Optional[str] = None, requisition_id: Optional[str] = None) -> bool:
        """Update job identifiers (job_post_url and requisition_id)"""
        return await self.job_repo.update_job_identifiers(job_id, job_post_url, requisition_id)
