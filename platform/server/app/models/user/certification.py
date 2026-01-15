from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import Column, ForeignKey, String, Date, Boolean
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin, UserOwnedMixin


class UserCertification(Base, UUIDMixin, TimestampMixin, UserOwnedMixin):
    user = relationship("User", back_populates="certifications")
    __tablename__ = "user_certifications"
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    issuing_organization: Mapped[str] = mapped_column(String(200), nullable=False)
    
    issue_date: Mapped[Optional[date]] = mapped_column(Date)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date)
    does_not_expire: Mapped[bool] = mapped_column(Boolean, default=False)
    
    credential_id: Mapped[Optional[str]] = mapped_column(String(200))
    credential_url: Mapped[Optional[str]] = mapped_column(String(500))
    
    @property
    def is_valid(self) -> bool:
        if self.does_not_expire:
            return True
        if not self.expiry_date:
            return True
        return self.expiry_date >= date.today()
    
    @property
    def is_expired(self) -> bool:
        return not self.is_valid and not self.does_not_expire
    
    @property
    def expiry_status(self) -> str:
        if self.does_not_expire:
            return "Lifetime"
        if not self.expiry_date:
            return "No expiry"
        if self.is_expired:
            return f"Expired ({self.expiry_date})"
        return f"Valid until {self.expiry_date}"
