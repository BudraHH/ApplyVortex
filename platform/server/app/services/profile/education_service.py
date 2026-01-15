from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user.education_repository import EducationRepository
from app.schemas.user.education import (
    BulkEducationCreate, 
    BulkEducationResponse, 
    EducationResponse
)

from app.repositories.user.notification_repository import NotificationRepository
from app.constants.constants import NotificationType
from app.services.cache.redis_service import redis_service, cached

class EducationService:
    def __init__(
        self, 
        db: AsyncSession = None, 
        education_repo: EducationRepository = None,
        notification_repo: NotificationRepository = None
    ):
        self.db = db
        self.education_repo = education_repo or EducationRepository(db)
        self.notification_repo = notification_repo or NotificationRepository(db)
    
    async def replace_all(self, user_id: UUID, data: BulkEducationCreate) -> BulkEducationResponse:
        """Replace ALL educations (resume parser UX)"""
        educations = await self.education_repo.replace_all(user_id, data.educations)
        await self.db.commit()
        
        # Raise notification
        await self.notification_repo.create_notification(
            user_id=user_id,
            type=NotificationType.SYSTEM,
            title="Education Details updated",
            message="Your education records have been successfully updated.",
            action_url="/profile-setup?tab=education",
            metadata={"source": "manual_edit", "category": "education"}
        )
        
        # Invalidate Cache
        await redis_service.delete(f"cache:user:{user_id}:education")
        
        return BulkEducationResponse(
            educations=[EducationResponse.model_validate(edu) for edu in educations],
            total_count=len(educations)
        )
    
    @cached(ttl_seconds=3600, key_builder=lambda f, self, user_id: f"cache:user:{user_id}:education", response_model=BulkEducationResponse)
    async def get_all(self, user_id: UUID) -> BulkEducationResponse:
        """Get ALL user educations (sorted by display_order)"""
        educations = await self.education_repo.get_by_user_id(user_id)
        return BulkEducationResponse(
            educations=[EducationResponse.model_validate(edu) for edu in educations],
            total_count=len(educations)
        )
    
    async def get_highest_education(self, user_id: UUID) -> EducationResponse:
        """Get highest/recent education for profile summary"""
        educations = await self.education_repo.get_by_user_id(user_id)
        if not educations:
            raise HTTPException(status_code=404, detail="No education found")
        
        # Sort by end_year desc, then start_year desc
        highest = max(educations, key=lambda e: (e.end_year or 9999, e.start_year))
        return EducationResponse.model_validate(highest)
