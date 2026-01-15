from typing import Optional, Dict, Any
from sqlalchemy import String, ForeignKey, Text, SmallInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from uuid import UUID as UUIDType

from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin
from datetime import datetime
from app.constants.constants import AlertSeverity, AlertStatus

class SystemAlert(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "system_alerts"

    type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    severity: Mapped[int] = mapped_column(SmallInteger, default=AlertSeverity.INFO.value, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[Optional[str]] = mapped_column(String(100))
    
    status: Mapped[int] = mapped_column(SmallInteger, default=AlertStatus.ACTIVE.value, index=True)
    
    resolved_at: Mapped[Optional[datetime]]
    resolved_by_user_id: Mapped[Optional[UUIDType]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    
    metadata_context: Mapped[Optional[Dict[str, Any]]] = mapped_column("metadata", JSONB, default={})

    # Relationships
    resolved_by = relationship("User", foreign_keys=[resolved_by_user_id])

