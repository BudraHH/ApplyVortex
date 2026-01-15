from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import INET, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin
from app.models.user.user import User


class UserSession(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user_sessions"
    
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user: Mapped["User"] = relationship("User", back_populates="sessions")
    
    refresh_token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    access_token_jti: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    
    device_name: Mapped[Optional[str]] = mapped_column(String(200))
    device_fingerprint: Mapped[Optional[str]] = mapped_column(String(255))
    user_agent: Mapped[Optional[str]] = mapped_column(Text)
    ip_address: Mapped[Optional[str]] = mapped_column(INET)
    
    country: Mapped[Optional[str]] = mapped_column(String(100))
    city: Mapped[Optional[str]] = mapped_column(String(100))
    
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    last_activity_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), index=True)
    revoked_reason: Mapped[Optional[str]] = mapped_column(Text)
    
    @property
    def is_active(self) -> bool:
        return self.revoked_at is None and self.expires_at > datetime.now()
    
    @property
    def is_expired(self) -> bool:
        return self.expires_at <= datetime.now()
    
    def revoke(self, reason: Optional[str] = None) -> None:
        self.revoked_at = datetime.now()
        if reason:
            self.revoked_reason = reason
    
    def touch(self) -> None:
        self.last_activity_at = datetime.now()
