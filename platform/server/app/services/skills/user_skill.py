from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.skill.user_skill_repository import UserSkillRepository
from app.schemas.skill.user_skill import (
    BulkUserSkillCreate, 
    BulkUserSkillResponse, 
    UserSkillCreate, 
    UserSkillResponse
)
from app.services.skills.skill import SkillService

from app.repositories.user.notification_repository import NotificationRepository
from app.constants.constants import NotificationType

from sqlalchemy import update
from app.models.skill.user_skill import UserSkillMap

class UserSkillService:
    def __init__(
        self, 
        db: AsyncSession = None, 
        user_skill_repo: UserSkillRepository = None,
        skill_service: SkillService = None,
        notification_repo: NotificationRepository = None
    ):
        self.db = db
        # Use provided repo or create one. Note: UserSkillRepository needs skill_repo
        self.user_skill_repo = user_skill_repo or UserSkillRepository(db, None) 
        self.skill_service = skill_service
        self.notification_repo = notification_repo or NotificationRepository(db)
    
    async def replace_all(self, user_id: UUID, data: BulkUserSkillCreate) -> BulkUserSkillResponse:
        """Replace all user skills (resume parser UX)"""
        skills = await self.user_skill_repo.replace_all(user_id, data.skills)
        await self.db.commit()
        
        # Raise notification
        await self.notification_repo.create_notification(
            user_id=user_id,
            type=NotificationType.SYSTEM,
            title="Skills Updated",
            message="Your skills library has been successfully updated.",
            action_url="/profile-setup?tab=skills",
            metadata={"source": "manual_edit", "category": "skills"}
        )
        
        return BulkUserSkillResponse(
            skills=[UserSkillResponse.model_validate(skill) for skill in skills],
            total_count=len(skills)
        )
    
    async def get_user_skills(self, user_id: UUID) -> BulkUserSkillResponse:
        """Get all user skills with computed properties"""
        skills = await self.user_skill_repo.get_by_user_id(user_id)
        
        return BulkUserSkillResponse(
            skills=[UserSkillResponse.model_validate(skill) for skill in skills],
            total_count=len(skills)
        )
    
    
    async def add_skill(self, user_id: UUID, skill_data: UserSkillCreate) -> UserSkillResponse:
        """Add single skill (manual entry)"""
        # Get or create skill
        skill_response = await self.skill_service.get_or_create_skill(skill_data.name)
        
        mapping = await self.user_skill_repo.create(UserSkillMap(skill_id=skill_response.id, user_id=user_id))
        
        # Raise notification
        await self.notification_repo.create_notification(
            user_id=user_id,
            type=NotificationType.SYSTEM,
            title="Skill Changed",
            message=f"Added '{skill_response.name}' to your skill set.",
            action_url="/profile-setup?tab=skills",
            metadata={"source": "manual_edit", "category": "skills", "skill_name": skill_response.name}
        )
        
        return UserSkillResponse.model_validate(mapping)
    
