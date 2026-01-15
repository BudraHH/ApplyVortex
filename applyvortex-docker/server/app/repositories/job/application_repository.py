"""Job application repository."""

from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.job.job_application import JobApplication
from app.constants.constants import ApplicationStatus as JobApplicationStatus
from app.schemas.job.application import ApplicationCreate

from app.repositories.base import BaseRepository

class ApplicationRepository(BaseRepository[JobApplication]):
    """Repository for job application operations."""
    
    def __init__(self, session: AsyncSession):
        super().__init__(session, JobApplication)
    
    async def create_application(self, user_id: UUID, **kwargs) -> JobApplication:
        """Create a new application."""
        application = JobApplication(
            user_id=user_id,
            **kwargs
        )
        return await self.create(application)
    
    async def get_by_user_and_job(self, user_id: UUID, job_id: UUID) -> Optional[JobApplication]:
        """Get an application by user and job."""
        query = (
            select(JobApplication)
            .where(
                and_(
                    JobApplication.user_id == user_id,
                    JobApplication.job_id == job_id
                )
            )
            .options(selectinload(JobApplication.job))
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_user_applications(
        self,
        user_id: UUID,
        status: Optional[int] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[JobApplication]:
        """Get all applications for a user."""
        query = (
            select(JobApplication)
            .where(JobApplication.user_id == user_id)
            .options(selectinload(JobApplication.job))
            .order_by(JobApplication.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        
        if status:
            query = query.where(JobApplication.status == status)
        
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def update_application_status(
        self,
        application_id: UUID,
        status: int
    ) -> Optional[JobApplication]:
        """Update application status."""
        updates = {"status": status}
        return await self.update(application_id, updates)
    
    async def get_stats(self, user_id: UUID) -> dict:
        """Get application statistics for a user."""
        # Get total count
        total_query = select(func.count(JobApplication.id)).where(
            JobApplication.user_id == user_id
        )
        total_result = await self.session.execute(total_query)
        total = total_result.scalar() or 0
        
        # Get counts by status
        stats = {
            "total": total,
            "pending": 0,
            "applied": 0,
            "interview": 0,
            "offer": 0,
            "rejected": 0,
            "withdrawn": 0,
        }
        
        for status in JobApplicationStatus:
            count_query = select(func.count(JobApplication.id)).where(
                and_(
                    JobApplication.user_id == user_id,
                    JobApplication.status == status
                )
            )
            count_result = await self.session.execute(count_query)
            count = count_result.scalar() or 0
            stats[status.value] = count
        
        # Calculate response rate
        responded = stats["interview"] + stats["offer"] + stats["rejected"]
        stats["response_rate"] = round((responded / total * 100) if total > 0 else 0, 2)
        
        return stats

    async def count_applications_since(self, user_id: UUID, since: datetime) -> int:
        """Count applications created since a specific datetime"""
        from datetime import datetime as dt
        
        query = select(func.count(JobApplication.id)).where(
            and_(
                JobApplication.user_id == user_id,
                JobApplication.created_at >= since
            )
        )
        
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def count_applied_since(self, user_id: UUID, since: datetime) -> int:
        """Count applications with status=APPLIED since a specific datetime (auto-applications)"""
        from app.constants.constants import ApplicationStatus
        
        query = select(func.count(JobApplication.id)).where(
            and_(
                JobApplication.user_id == user_id,
                JobApplication.status == ApplicationStatus.APPLIED.value,
                JobApplication.applied_at >= since
            )
        )
        
        result = await self.session.execute(query)
        return result.scalar() or 0
