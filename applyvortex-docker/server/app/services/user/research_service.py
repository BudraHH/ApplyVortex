from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user.research_repository import ResearchRepository
from app.repositories.user.notification_repository import NotificationRepository
from app.constants.constants import NotificationType
from app.schemas.user.research import (
    ResearchResponse,
    BulkResearchCreate,
    BulkResearchResponse
)


class ResearchService:
    def __init__(
        self, 
        db: AsyncSession = None,
        research_repo: ResearchRepository = None,
        notification_repo: NotificationRepository = None
    ):
        self.db = db
        self.repository = research_repo or ResearchRepository(db)
        self.notification_repo = notification_repo or NotificationRepository(db)

    async def get_all(self, user_id: UUID) -> BulkResearchResponse:
        """Get all research publications for a user"""
        research_list = await self.repository.get_by_user_id(user_id)
        
        return BulkResearchResponse(
            research=[ResearchResponse.model_validate(r) for r in research_list],
            total_count=len(research_list)
        )

    async def replace_all(self, user_id: UUID, data: BulkResearchCreate) -> BulkResearchResponse:
        """Save/replace all research publications for a user"""
        # Replace all research
        research_list = await self.repository.replace_all(user_id, data.research)
        await self.db.commit()
        
        # Raise notification
        await self.notification_repo.create_notification(
            user_id=user_id,
            type=NotificationType.SYSTEM,
            title="Research Updated",
            message="Your research publications have been successfully updated.",
            action_url="/profile-setup?tab=additional",
            metadata={"source": "manual_edit", "category": "research"}
        )
        
        return BulkResearchResponse(
            research=[ResearchResponse.model_validate(r) for r in research_list],
            total_count=len(research_list)
        )
