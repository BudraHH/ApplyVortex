from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user.accomplishment_repository import AccomplishmentRepository
from app.schemas.user.accomplishment import BulkAccomplishmentCreate, BulkAccomplishmentResponse

from app.repositories.user.notification_repository import NotificationRepository
from app.constants.constants import NotificationType

class AccomplishmentService:
    def __init__(
        self, 
        db: AsyncSession = None, 
        accomplishment_repo: AccomplishmentRepository = None,
        notification_repo: NotificationRepository = None
    ):
        self.db = db
        self.repository = accomplishment_repo or AccomplishmentRepository(db)
        self.notification_repo = notification_repo or NotificationRepository(db)
        
    async def replace_all(self, user_id: UUID, data: BulkAccomplishmentCreate) -> BulkAccomplishmentResponse:
        """Replace all accomplishments for a user."""
        items = await self.repository.replace_all(user_id, data.accomplishments)
        await self.db.commit()
        
        # Raise notification
        await self.notification_repo.create_notification(
            user_id=user_id,
            type=NotificationType.SYSTEM,
            title="Accomplishments Updated",
            message="Your accomplishments have been successfully updated.",
            action_url="/profile-setup?tab=additional",
            metadata={"source": "manual_edit", "category": "accomplishment"}
        )
        
        return BulkAccomplishmentResponse(
            accomplishments=items,
            total_count=len(items)
        )
        
    async def get_all(self, user_id: UUID) -> BulkAccomplishmentResponse:
        """Get all accomplishments for a user."""
        items = await self.repository.get_by_user_id(user_id)
        return BulkAccomplishmentResponse(
            accomplishments=items,
            total_count=len(items)
        )
