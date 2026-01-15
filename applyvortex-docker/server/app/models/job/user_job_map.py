from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID

from sqlalchemy import String, ForeignKey, DateTime, SmallInteger
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.user.user import User
    from .job import Job


class UserJobMap(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user_job_map"

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    job_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    blueprint_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_blueprints.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Personal state for the user
    application_status: Mapped[int] = mapped_column(SmallInteger, default=0)  # 0 = NOT_APPLIED
    applied_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    scraped_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_job_maps")
    job: Mapped["Job"] = relationship("Job", back_populates="user_job_maps")

    def __repr__(self) -> str:
        return f"<UserJobMap(user_id={self.user_id}, job_id={self.job_id}, status='{self.application_status}')>"
