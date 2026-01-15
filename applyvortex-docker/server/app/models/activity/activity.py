from sqlalchemy import String, DateTime, ForeignKey, Integer, SmallInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid import UUID, uuid4
from datetime import datetime

from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user.user import User
    from app.models.job.job import Job


class Activity(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "activity_log"

    activity_type: Mapped[str] = mapped_column(String(50), index=True)  # scrape, application, profile_update
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    job_id: Mapped[UUID] = mapped_column(ForeignKey("jobs.id"), nullable=True)
    portal: Mapped[int] = mapped_column(SmallInteger, nullable=True)

    # Activity details
    search_keywords: Mapped[str] = mapped_column(String(500), nullable=True)
    job_title: Mapped[str] = mapped_column(String(500), nullable=True)
    jobs_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(50), nullable=True)  # applied, interview, offer

    # Metadata
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str] = mapped_column(String(500), nullable=True)

    # Relationships (use string references)
    user: Mapped["User"] = relationship("User", back_populates="activities")
    job: Mapped["Job"] = relationship("Job", back_populates="activities")
