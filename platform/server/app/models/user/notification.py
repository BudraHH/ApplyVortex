from typing import Optional
from uuid import UUID
from sqlalchemy import String, Boolean, ForeignKey, SmallInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.models.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin


class UserNotification(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user_notifications"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    type: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(String, nullable=False)
    action_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    metadata_payload: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, default=dict)

    # Relationships
    user = relationship("User", backref="notifications")
