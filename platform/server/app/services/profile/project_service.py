from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user.project_repository import ProjectRepository
from app.schemas.user.project import (
    BulkProjectCreate, 
    BulkProjectResponse, 
    ProjectResponse
)
from app.services.skills.skill import SkillService


from app.repositories.user.notification_repository import NotificationRepository
from app.constants.constants import NotificationType
from app.services.cache.redis_service import redis_service, cached

class ProjectService:
    def __init__(
        self, 
        db: AsyncSession = None,
        project_repo: ProjectRepository = None,
        skill_service: SkillService = None,
        notification_repo: NotificationRepository = None
    ):
        self.db = db
        self.project_repo = project_repo or ProjectRepository(db)
        self.skill_service = skill_service
        self.notification_repo = notification_repo or NotificationRepository(db)
    
    async def replace_all(self, user_id: UUID, data: BulkProjectCreate) -> BulkProjectResponse:
        """Replace ALL projects + auto-map skills (resume parser UX)"""
        projects = await self.project_repo.replace_all(user_id, data.projects)
        await self.db.commit()
        
        # Raise notification
        await self.notification_repo.create_notification(
            user_id=user_id,
            type=NotificationType.SYSTEM,
            title="Projects Data Changed",
            message="Your project portfolio has been successfully updated.",
            action_url="/profile-setup?tab=projects",
            metadata={"source": "manual_edit", "category": "projects"}
        )
        
        # Invalidate Cache
        await redis_service.delete(f"cache:user:{user_id}:projects")

        return BulkProjectResponse(
            projects=[ProjectResponse.model_validate(project) for project in projects],
            total_count=len(projects)
        )
    
    @cached(ttl_seconds=3600, key_builder=lambda f, self, user_id: f"cache:user:{user_id}:projects", response_model=BulkProjectResponse)
    async def get_all(self, user_id: UUID) -> BulkProjectResponse:
        """Get ALL user projects (sorted by display_order)"""
        projects = await self.project_repo.get_by_user_id(user_id)
        return BulkProjectResponse(
            projects=[ProjectResponse.model_validate(project) for project in projects],
            total_count=len(projects)
        )
    
    async def get_featured_projects(self, user_id: UUID, limit: int = 3) -> List[ProjectResponse]:
        """Get top featured projects for profile showcase"""
        projects = await self.project_repo.get_featured_projects(user_id, limit)
        return [ProjectResponse.model_validate(p) for p in projects]
