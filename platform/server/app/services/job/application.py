from typing import List, Dict, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.job.application_repository import ApplicationRepository
from app.repositories.job.job_repository import JobRepository
from datetime import datetime


from fastapi import HTTPException
from app.schemas.job.application import (
    ApplicationCreate,
    ApplicationResponse, 
    ApplicationUpdate,
    ApplicationStats
)

class ApplicationService:
    def __init__(
        self, 
        db: AsyncSession = None, 
        application_repo: ApplicationRepository = None,
        job_repo: JobRepository = None
    ):
        self.db = db
        self.application_repo = application_repo or ApplicationRepository(db)
        self.job_repo = job_repo or JobRepository(db)
    
    async def create_application(
        self, 
        user_id: UUID, 
        job_id: UUID, 
        resume_id: UUID, 
        cover_letter: Optional[str] = None
    ) -> ApplicationResponse:
        """Create new job application"""
        # Verify job belongs to user
        job = await self.job_repo.get_by(id=job_id, user_id=user_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Check if application already exists
        existing = await self.application_repo.get_by_user_and_job(user_id, job_id)
        if existing:
            raise HTTPException(
                status_code=409,
                detail="Application already exists for this job"
            )
        
        # Create schema for repository
        app_data = ApplicationCreate(
            job_id=job_id,
            resume_used_id=resume_id,
            notes=f"Applied via ApplyVortex on {datetime.utcnow().strftime('%Y-%m-%d')}"
        )
        
        application = await self.application_repo.create(
            user_id=user_id,
            application_data=app_data
        )
        
        # Update job status
        await self.job_repo.update_status(job_id, "applied")
        
        return ApplicationResponse.model_validate(application)
    
    async def get_user_applications(self, user_id: UUID) -> List[ApplicationResponse]:
        """Get all applications for user"""
        applications = await self.application_repo.get_user_applications(user_id)
        return [ApplicationResponse.model_validate(app) for app in applications]
    
    async def update_application_status(
        self, 
        application_id: UUID, 
        user_id: UUID, 
        update_data: ApplicationUpdate
    ) -> ApplicationResponse:
        """Update application status (interviewing, rejected, etc.)"""
        application = await self.application_repo.get(application_id)
        if not application or application.user_id != user_id:
            raise HTTPException(status_code=404, detail="Application not found")
        
        updated_app = await self.application_repo.update(
            application_id=application_id, 
            update_data=update_data
        )
        
        return ApplicationResponse.model_validate(updated_app)
    
    async def get_application_stats(self, user_id: UUID) -> ApplicationStats:
        """Get application status statistics"""
        stats = await self.application_repo.get_stats(user_id)
        return ApplicationStats.model_validate(stats)
    
    async def bulk_create_applications(
        self, 
        user_id: UUID, 
        applications: List[Dict]
    ) -> List[ApplicationResponse]:
        """Bulk create applications from job scraping"""
        created_apps = []
        for app_data in applications:
            app = await self.create_application(
                user_id=user_id,
                job_id=app_data['job_id'],
                resume_id=app_data['resume_id'],
                cover_letter=app_data.get('cover_letter')
            )
            created_apps.append(app)
        return created_apps
    
    async def get_next_interview(self, user_id: UUID):
        """Used by DashboardService"""
        # Implementation depends on application_repo having this or using list_all
        from app.constants.constants import ApplicationStatus as JobApplicationStatus
        apps = await self.application_repo.get_user_applications(
            user_id=user_id, 
            status=JobApplicationStatus.INTERVIEW,
            limit=1
        )
        return apps[0] if apps else None

    async def get_upcoming_deadlines(self, user_id: UUID, days: int = 14):
        """Used by DashboardService"""
        # For now, return recent applications as 'deadlines' placeholder or empty
        return await self.application_repo.get_user_applications(user_id=user_id, limit=5)
