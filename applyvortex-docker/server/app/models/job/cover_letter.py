from typing import Optional
from sqlalchemy import String, Integer, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin

class UserCoverLetter(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user_cover_letters"

    user_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id: Mapped[Optional[UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="SET NULL"), index=True)
    
    # Meta
    name: Mapped[Optional[str]] = mapped_column(String(200))
    is_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Content (Generated or Parsed)
    content_text: Mapped[Optional[str]] = mapped_column(Text) 
    tailoring_prompt: Mapped[Optional[str]] = mapped_column(Text)
    tone: Mapped[int] = mapped_column(Integer, default=1) # 1: PROFESSIONAL
    
    # File (R2 Storage)
    file_url: Mapped[Optional[str]] = mapped_column(String(500))
    file_path: Mapped[Optional[str]] = mapped_column(String(500))
    file_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    file_format: Mapped[int] = mapped_column(Integer, default=1) # 1: PDF
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer)
    
    word_count: Mapped[Optional[int]] = mapped_column(Integer)
    is_final: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="cover_letters")
    job = relationship("Job", back_populates="cover_letters")
