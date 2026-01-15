from typing import Optional
from uuid import UUID

from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB, INET
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin

class SystemLog(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "system_logs"

    # Core context
    action: Mapped[str] = mapped_column(String(255), nullable=False, index=True) 
    status: Mapped[str] = mapped_column(String(20), default="SUCCESS", index=True) 
    user_id: Mapped[Optional[UUID]] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True)
    
    # Target Resource: Which Resume/Job/Subscription was touched?
    resource_id: Mapped[Optional[UUID]] = mapped_column(PG_UUID(as_uuid=True), index=True)

    # Source: Where did the request come from? (Security)
    ip_address: Mapped[Optional[str]] = mapped_column(INET) 

    # Metrics
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    details: Mapped[Optional[dict]] = mapped_column(JSONB, default={})

    def __repr__(self) -> str:
        return f"<SystemLog(action='{self.action}', status='{self.status}', user_id={self.user_id})>"
