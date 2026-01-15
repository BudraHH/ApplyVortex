from datetime import datetime
from sqlalchemy import Integer, Boolean, TIMESTAMP, ForeignKey, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin

class SystemUsageCredits(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "system_usage_credits"

    user_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    cycle_start_date: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    cycle_end_date: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    
    # Quotas
    resumes_generated: Mapped[int] = mapped_column(Integer, default=0)
    resumes_limit: Mapped[int] = mapped_column(Integer, default=5)
    
    cover_letters_generated: Mapped[int] = mapped_column(Integer, default=0)
    cover_letters_limit: Mapped[int] = mapped_column(Integer, default=10)
    
    applications_submitted: Mapped[int] = mapped_column(Integer, default=0)
    applications_limit: Mapped[int] = mapped_column(Integer, default=50)
    
    total_ai_tokens_used: Mapped[int] = mapped_column(BigInteger, default=0)

    # Relationships
    user = relationship("User", back_populates="usage_credits")
