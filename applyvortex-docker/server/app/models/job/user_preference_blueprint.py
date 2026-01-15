from datetime import datetime, timezone, timedelta
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import String, Integer, ARRAY, Boolean, DateTime, SmallInteger
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin, UserOwnedMixin
from app.constants.constants import (
    JobAlertDelivery
)

if TYPE_CHECKING:
    pass


class UserBlueprint(Base, UUIDMixin, TimestampMixin, UserOwnedMixin):
    __tablename__ = "user_blueprints"

    # Blueprint Meta
    name: Mapped[Optional[str]] = mapped_column(String(255))

    # Search Filters
    keywords: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String))
    excluded_keywords: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String))
    locations: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String))
    portal: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    companies: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String))

    # Compensation Filters
    min_salary: Mapped[Optional[int]] = mapped_column(Integer)


    # Job Filters
    experience_level: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    job_type: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    work_mode: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)

    # Delivery Settings
    frequency: Mapped[int] = mapped_column(Integer, default=86400)  # Seconds (e.g. 86400 = 24h)
    date_posted: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # e.g. "past-24h"
    delivery_method: Mapped[int] = mapped_column(SmallInteger, default=JobAlertDelivery.EMAIL.value)

    # Status & Stats
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[int] = mapped_column(SmallInteger, default=0) # 0=Idle, 1=AutoScrape, 2=AutoApply

    last_delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    total_deliveries: Mapped[int] = mapped_column(Integer, default=0)
    total_jobs_matched: Mapped[int] = mapped_column(Integer, default=0)

    # Snooze/Quiet Hours
    snoozed_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    # user: Inherited from UserOwnedMixin

    @property
    def is_snoozed(self) -> bool:
        """Alert temporarily paused."""
        if not self.snoozed_until:
            return False
        return self.snoozed_until > datetime.now(timezone.utc)

    @property
    def should_deliver_now(self) -> bool:
        """Ready for delivery based on frequency."""
        if not self.is_active or self.is_snoozed:
            return False

        if not self.last_delivered_at:
            return True  # First delivery

        # If immediate (0 or very small), deliver
        if self.frequency <= 0:
            return True

        now = datetime.now(timezone.utc)
        delta = now - self.last_delivered_at
        
        return delta >= timedelta(seconds=self.frequency)

    @property
    def filter_count(self) -> int:
        """Total active filters."""
        count = sum(1 for attr in [
            self.keywords, self.locations, self.companies
        ] if attr)
        
        if self.experience_level: count += 1
        if self.job_type: count += 1
        if self.work_mode: count += 1
        if self.min_salary: count += 1

        return count

    def increment_delivery(self) -> None:
        """Record successful delivery."""
        self.total_deliveries += 1
        self.last_delivered_at = datetime.now(timezone.utc)

    def increment_jobs_matched(self, count: int = 1) -> None:
        """Record jobs found for this alert."""
        self.total_jobs_matched += count

    def snooze(self, hours: int) -> None:
        """Temporarily pause alerts."""
        self.snoozed_until = datetime.now(timezone.utc) + timedelta(hours=hours)

    def activate(self) -> None:
        """Resume alerts."""
        self.is_active = True
        self.snoozed_until = None

    def deactivate(self) -> None:
        """Pause alerts."""
        self.is_active = False

    def __repr__(self) -> str:
        keywords = ", ".join(self.keywords[:3]) if self.keywords else "any"
        return (f"<UserBlueprint(id={self.id}, user_id={self.user_id}, "
                f"name={self.name}, keywords=[{keywords}], active={self.is_active})>")
