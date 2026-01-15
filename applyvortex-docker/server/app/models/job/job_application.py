from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from uuid import UUID

from sqlalchemy import String, Text, Boolean, ForeignKey, SmallInteger
from sqlalchemy import DateTime
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin, UserOwnedMixin
from app.constants.constants import ApplicationStatus, ApplicationMethod

if TYPE_CHECKING:
    from app.models.user.user import User
    from .job import Job
    from app.models.user.resume import UserResume  # Assuming this exists


class JobApplication(Base, UUIDMixin, TimestampMixin, UserOwnedMixin):
    __tablename__ = "job_applications"

    # Job Reference
    job_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Status Tracking
    status: Mapped[int] = mapped_column(SmallInteger, default=ApplicationStatus.NOT_APPLIED.value, index=True)
    applied_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    response_received_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    interview_scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    offer_received_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Documents Used
    resume_used_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_resumes.id", ondelete="SET NULL"),
        index=True
    )
    cover_letter_used_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_resumes.id", ondelete="SET NULL")
    )

    # Tracking Details
    application_source: Mapped[Optional[int]] = mapped_column(SmallInteger)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    # Follow-up
    next_followup_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text)

    # Response Tracking
    response_received: Mapped[bool] = mapped_column(Boolean, default=False)

    # Automation
    automation_status: Mapped[Optional[str]] = mapped_column(String(50)) # e.g., 'started', 'completed', 'failed'
    automation_logs: Mapped[Optional[dict]] = mapped_column(JSONB)
    screenshots: Mapped[Optional[list]] = mapped_column(JSONB) # List of file keys
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    preferred_method: Mapped[int] = mapped_column(SmallInteger, default=ApplicationMethod.AUTO.value, nullable=False)
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="applications",
        foreign_keys="[JobApplication.user_id]"
    )
    job: Mapped["Job"] = relationship(
        "Job",
        back_populates="applications",
        foreign_keys=[job_id]
    )
    resume_used: Mapped[Optional["UserResume"]] = relationship(
        "UserResume",
        foreign_keys=[resume_used_id],
        back_populates="applications_used"
    )
    cover_letter_used: Mapped[Optional["UserResume"]] = relationship(
        "UserResume",
        foreign_keys=[cover_letter_used_id]
    )
    
    
    @property
    def is_active_process(self) -> bool:
        """Returns True if application is ongoing (not rejected/withdrawn/offer accepted)"""
        return self.status in [
            ApplicationStatus.NOT_APPLIED.value, 
            ApplicationStatus.APPLIED.value, 
            ApplicationStatus.INTERVIEW.value
        ]

    @property
    def is_successful(self) -> bool:
        return self.status == ApplicationStatus.OFFER.value # or accepted.
        
    @property
    def days_since_applied(self) -> Optional[int]:
        """Days since application submitted."""
        if not self.applied_at:
            return None
        return (datetime.now(self.applied_at.tzinfo) - self.applied_at).days

    @property
    def needs_followup(self) -> bool:
        """Requires follow-up action."""
        return (
                self.is_active_application and
                self.next_followup_at and
                self.next_followup_at <= datetime.now(self.next_followup_at.tzinfo)
        )

    def mark_applied(self) -> None:
        """Transition to applied state."""
        self.status = ApplicationStatus.APPLIED.value
        self.applied_at = datetime.now(timezone.utc)

    def __repr__(self) -> str:
        return (f"<JobApplication(id={self.id}, user_id={self.user_id}, "
                f"job_id={self.job_id}, status='{self.status.value}')>")
