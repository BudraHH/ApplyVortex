from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy import Column, String, Integer, Text, Boolean, ARRAY, DateTime, ForeignKey, SmallInteger, Index
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB

from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.job.job_application import JobApplication

from app.models.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin, UserOwnedMixin, ActiveMixin
from app.constants.constants import ResumeType, ParsingStatus, ResumeFileFormat


class UserResume(Base, UUIDMixin, TimestampMixin, UserOwnedMixin, ActiveMixin):
    user = relationship("User", back_populates="resumes")
    __tablename__ = "user_resumes"
    
    __table_args__ = (
        Index('idx_unique_user_base_resume', 'user_id', unique=True, postgresql_where=(Column('resume_type') == 1)), # 1: BASE
    )
    
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    resume_type: Mapped[int] = mapped_column(SmallInteger, default=ResumeType.MANUAL.value, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    file_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=False)
    file_format: Mapped[int] = mapped_column(SmallInteger, default=ResumeFileFormat.PDF.value, nullable=False)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer)
    file_hash: Mapped[Optional[str]] = mapped_column(String(64))
    
    parsing_status: Mapped[int] = mapped_column(SmallInteger, default=ParsingStatus.PENDING.value)
    parsing_started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    parsing_completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    parsing_error: Mapped[Optional[str]] = mapped_column(Text)
    parsed_data: Mapped[Optional[dict]] = mapped_column(JSONB)
    structured_content: Mapped[Optional[dict]] = mapped_column(JSONB)
    optimization_metadata: Mapped[Optional[dict]] = mapped_column(JSONB)
    
    tailored_for_job_id: Mapped[Optional[UUID]] = mapped_column(PG_UUID(as_uuid=True))
    tailoring_prompt: Mapped[Optional[str]] = mapped_column(Text)
    base_resume_id: Mapped[Optional[UUID]] = mapped_column(PG_UUID(as_uuid=True))
    
    template_name: Mapped[str] = mapped_column(String(100), default='modern')
    template_config: Mapped[Optional[dict]] = mapped_column(JSONB)
    
    version: Mapped[int] = mapped_column(Integer, default=1)
    times_used: Mapped[int] = mapped_column(Integer, default=0)
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    
    ats_score: Mapped[Optional[int]] = mapped_column(Integer)
    ats_issues: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text))
    
    notes: Mapped[Optional[str]] = mapped_column(Text)
    tags: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text))
    archived_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    @property
    def is_ready(self) -> bool:
        return self.is_active and self.parsing_status == ParsingStatus.SUCCESS.value
    
    @property
    def parsing_complete(self) -> bool:
        return self.parsing_status == ParsingStatus.SUCCESS.value
    
    @property
    def has_ats_issues(self) -> bool:
        return self.ats_score is not None and self.ats_score < 80

    applications_used: Mapped[list["JobApplication"]] = relationship(
        "JobApplication",
        back_populates="resume_used",
        foreign_keys="JobApplication.resume_used_id"
    )