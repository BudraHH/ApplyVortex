from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from app.constants.constants import NotificationType

class NotificationBase(BaseModel):
    title: str
    message: str
    type: NotificationType
    action_url: Optional[str] = None
    metadata_payload: Optional[Dict[str, Any]] = None

class NotificationCreate(NotificationBase):
    user_id: UUID

class NotificationResponse(NotificationBase):
    id: UUID
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
