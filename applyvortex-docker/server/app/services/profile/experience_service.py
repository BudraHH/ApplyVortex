from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user.experience_repository import ExperienceRepository
from app.schemas.user.experience import (
    BulkExperienceCreate, 
    BulkExperienceResponse, 
    ExperienceResponse
)
from app.services.skills.skill import SkillService


from app.repositories.user.notification_repository import NotificationRepository
from app.constants.constants import NotificationType
from app.services.cache.redis_service import redis_service


class ExperienceService:
    def __init__(
        self, 
        db: AsyncSession = None,
        experience_repo: ExperienceRepository = None,
        skill_service: SkillService = None,
        notification_repo: NotificationRepository = None
    ):
        self.db = db
        self.experience_repo = experience_repo or ExperienceRepository(db)
        self.skill_service = skill_service
        self.notification_repo = notification_repo or NotificationRepository(db)
    
    async def replace_all(self, user_id: UUID, data: BulkExperienceCreate) -> BulkExperienceResponse:
        """Replace ALL experiences + auto-map skills (resume parser UX)"""
        experiences = await self.experience_repo.replace_all(user_id, data.experiences)
        await self.db.commit()
        
        # Raise notification
        await self.notification_repo.create_notification(
            user_id=user_id,
            type=NotificationType.SYSTEM,
            title="Work Experience Updated",
            message="Your work experience entries have been successfully updated.",
            action_url="/profile-setup?tab=experience",
            metadata={"source": "manual_edit", "category": "experience"}
        )
        
        # Invalidate Cache
        await redis_service.delete(f"cache:user:{user_id}:experience")

        return BulkExperienceResponse(
            experiences=[ExperienceResponse.model_validate(exp) for exp in experiences],
            total_count=len(experiences)
        )
    
    async def get_all(self, user_id: UUID) -> BulkExperienceResponse:
        """Get ALL user experiences (sorted by display_order)"""
        experiences = await self.experience_repo.get_by_user_id(user_id)
        return BulkExperienceResponse(
            experiences=[ExperienceResponse.model_validate(exp) for exp in experiences],
            total_count=len(experiences)
        )
