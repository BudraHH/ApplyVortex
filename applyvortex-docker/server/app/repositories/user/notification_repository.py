from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, update, delete
from sqlalchemy.orm import Session

from app.models.user.notification import UserNotification
from app.repositories.base import BaseRepository

class NotificationRepository(BaseRepository[UserNotification]):
    def __init__(self, session: Session):
        super().__init__(session, UserNotification)

    async def create_notification(
        self,
        user_id: UUID,
        type: int,
        title: str,
        message: str,
        action_url: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> UserNotification:
        notification = UserNotification(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            action_url=action_url,
            metadata_payload=metadata or {}
        )
        self.session.add(notification)
        # We perform a flush to get the ID but do NOT commit here.
        # The session-level commit (in get_session or task) will handle it.
        await self.session.flush()
        
        # Broadcast via WebSocket
        try:
            from app.services.notification_manager import notification_manager
            from app.schemas.user.notification import NotificationResponse
            
            # Serialize
            payload_data = NotificationResponse.model_validate(notification).model_dump(mode='json')
            ws_message = {
                "type": "NEW_NOTIFICATION",
                "data": payload_data
            }
            await notification_manager.broadcast_to_user(user_id, ws_message)
        except Exception as e:
            # Non-blocking logging if WS fails, main flow should continue
            import logging
            logging.getLogger(__name__).error(f"Failed to broadcast notification: {e}")

        return notification

    async def get_user_notifications(
        self,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20,
        unread_only: bool = False
    ) -> List[UserNotification]:
        query = select(UserNotification).where(UserNotification.user_id == user_id)
        
        if unread_only:
            query = query.where(UserNotification.is_read == False)
            
        query = query.order_by(UserNotification.created_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def mark_as_read(self, notification_id: UUID, user_id: UUID) -> bool:
        query = (
            update(UserNotification)
            .where(UserNotification.id == notification_id, UserNotification.user_id == user_id)
            .values(is_read=True)
        )
        result = await self.session.execute(query)
        return result.rowcount > 0

    async def mark_multiple_as_read(self, notification_ids: List[UUID], user_id: UUID) -> int:
        if not notification_ids:
            return 0
        query = (
            update(UserNotification)
            .where(UserNotification.id.in_(notification_ids), UserNotification.user_id == user_id)
            .values(is_read=True)
        )
        result = await self.session.execute(query)
        return result.rowcount

    async def mark_all_as_read(self, user_id: UUID) -> int:
        query = (
            update(UserNotification)
            .where(UserNotification.user_id == user_id, UserNotification.is_read == False)
            .values(is_read=True)
        )
        result = await self.session.execute(query)
        return result.rowcount

    async def delete_notification(self, notification_id: UUID, user_id: UUID) -> bool:
        query = delete(UserNotification).where(UserNotification.id == notification_id, UserNotification.user_id == user_id)
        result = await self.session.execute(query)
        return result.rowcount > 0

    async def delete_all(self, user_id: UUID) -> int:
        query = delete(UserNotification).where(UserNotification.user_id == user_id)
        result = await self.session.execute(query)
        return result.rowcount
