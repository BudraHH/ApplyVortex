from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import String, Integer, Boolean, Text, NUMERIC, DateTime, ForeignKey, SmallInteger
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin
from app.models.user.user import User
from app.constants.constants import JobSearchStatus, Availability, WorkMode


class UserProfile(Base, UUIDMixin, TimestampMixin):
    user = relationship("User", back_populates="profile")
    __tablename__ = "user_profiles"
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    gender: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    
    # Structured name fields
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    middle_name: Mapped[Optional[str]] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    phone_country_code: Mapped[Optional[str]] = mapped_column(String(10))
    alternate_phone: Mapped[Optional[str]] = mapped_column(String(20))
    alternate_phone_country_code: Mapped[Optional[str]] = mapped_column(String(10))

    
    headline: Mapped[Optional[str]] = mapped_column(String(200))
    professional_summary: Mapped[Optional[str]] = mapped_column(Text)
    current_role: Mapped[Optional[str]] = mapped_column(String(200))
    current_company: Mapped[Optional[str]] = mapped_column(String(200))
    years_of_experience: Mapped[Decimal] = mapped_column(NUMERIC(3, 1), default=0)
    
    
    # Current Address
    current_address: Mapped[Optional[str]] = mapped_column(String(500))
    current_city: Mapped[Optional[str]] = mapped_column(String(100))
    current_state: Mapped[Optional[str]] = mapped_column(String(100))
    current_country: Mapped[str] = mapped_column(String(100), default='India')
    current_postal_code: Mapped[Optional[str]] = mapped_column(String(20))

    
    # Permanent Address
    permanent_address: Mapped[Optional[str]] = mapped_column(String(500))
    permanent_city: Mapped[Optional[str]] = mapped_column(String(100))
    permanent_state: Mapped[Optional[str]] = mapped_column(String(100))
    permanent_country: Mapped[Optional[str]] = mapped_column(String(100))
    permanent_postal_code: Mapped[Optional[str]] = mapped_column(String(20))
    willing_to_relocate: Mapped[bool] = mapped_column(Boolean, default=True)

    preferred_work_mode: Mapped[int] = mapped_column(SmallInteger, default=WorkMode.ONSITE.value)
    job_search_status: Mapped[int] = mapped_column(SmallInteger, default=JobSearchStatus.ACTIVELY_LOOKING.value)
    availability: Mapped[int] = mapped_column(SmallInteger, default=Availability.IMMEDIATE.value)
    notice_period_days: Mapped[Optional[int]] = mapped_column(Integer)
    
    expected_salary_min: Mapped[Optional[int]] = mapped_column(Integer)
    expected_salary_max: Mapped[Optional[int]] = mapped_column(Integer)
    salary_currency: Mapped[str] = mapped_column(String(10), default='INR')

    github_url: Mapped[Optional[str]] = mapped_column(String(500))
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(500))
    portfolio_url: Mapped[Optional[str]] = mapped_column(String(500))
    leetcode_url: Mapped[Optional[str]] = mapped_column(String(500))
    naukri_url: Mapped[Optional[str]] = mapped_column(String(500))
    stackoverflow_url: Mapped[Optional[str]] = mapped_column(String(500))
    medium_url: Mapped[Optional[str]] = mapped_column(String(500))
    personal_website: Mapped[Optional[str]] = mapped_column(String(500))
    
    # Regional Settings
    timezone: Mapped[Optional[str]] = mapped_column(String(50))
    date_format: Mapped[Optional[str]] = mapped_column(String(20))
    
    profile_completeness: Mapped[int] = mapped_column(Integer, default=0)
    preferences: Mapped[Optional[dict]] = mapped_column(JSONB)
    last_updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)
    
    user: Mapped["User"] = relationship(back_populates="profile", lazy='joined')
    
    @property
    def full_name(self) -> str:
        """Computed full name from structured fields"""
        parts = [self.first_name]
        if self.middle_name:
            parts.append(self.middle_name)
        parts.append(self.last_name)
        return ' '.join(parts)
    
    @property
    def full_address(self) -> str:
        parts = [self.current_city, self.current_state, self.current_country]
        return ', '.join([p for p in parts if p])

    @property
    def email(self) -> Optional[str]:
        return self.user.email if self.user else None
