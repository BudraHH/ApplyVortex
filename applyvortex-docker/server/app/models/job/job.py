from datetime import datetime
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import String, Integer, Text, ARRAY, Boolean, SmallInteger
from sqlalchemy import DateTime  # ✅ CORRECT IMPORT (not postgresql)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin, FeaturedMixin
from app.constants.constants import (
    ExperienceLevel, JobType, WorkMode, Portal
)

if TYPE_CHECKING:
    # from .job_application import JobApplication
    from .job_match import JobMatchAnalysis
    from .cover_letter import UserCoverLetter
    from .user_job_map import UserJobMap


class Job(Base, UUIDMixin, TimestampMixin, FeaturedMixin):
    __tablename__ = "jobs"

    # Job Identity
    title: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    company_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    company_website: Mapped[Optional[str]] = mapped_column(String(255))

    # Identifiers
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    portal: Mapped[int] = mapped_column(SmallInteger, default=Portal.LINKEDIN.value, nullable=False, index=True)

    # Automation & Logic
    application_method: Mapped[int] = mapped_column(SmallInteger, default=2, nullable=False)  # Default DIRECT_APPLY (2)
    job_post_url: Mapped[str] = mapped_column(Text, nullable=False)
    external_apply_url: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    job_metadata: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, default={})

    # Location
    location_raw: Mapped[Optional[str]] = mapped_column(String(255))
    location_city: Mapped[Optional[str]] = mapped_column(String(100))
    location_state: Mapped[Optional[str]] = mapped_column(String(100))
    location_country: Mapped[Optional[str]] = mapped_column(String(100))
    work_mode: Mapped[Optional[int]] = mapped_column(SmallInteger, default=WorkMode.ONSITE.value)

    # Compensation
    salary_raw: Mapped[Optional[str]] = mapped_column(String(255))
    salary_min: Mapped[Optional[int]] = mapped_column(Integer)
    salary_max: Mapped[Optional[int]] = mapped_column(Integer)
    salary_currency: Mapped[Optional[str]] = mapped_column(String(10), default="INR")

    # Content
    description: Mapped[Optional[str]] = mapped_column(Text)
    experience_level: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    job_type: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    
    # AI/Parsed Data
    requirements: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text))
    responsibilities: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text))
    extracted_keywords: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text))

    # Lifecycle & Metrics
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    application_count: Mapped[int] = mapped_column(Integer, default=0)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    
    posted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    scraped_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Deep Scraping Fields
    applicants: Mapped[Optional[str]] = mapped_column(String(100))
    seniority_level: Mapped[Optional[str]] = mapped_column(String(100))
    deep_scraped_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    # job_portal relationship removed
    # job_portal relationship removed
    applications: Mapped[List["JobApplication"]] = relationship("JobApplication", back_populates="job", cascade="all, delete-orphan")
    match_scores: Mapped[List["JobMatchAnalysis"]] = relationship("JobMatchAnalysis", back_populates="job", cascade="all, delete-orphan")
    activities: Mapped[List["Activity"]] = relationship("Activity", back_populates="job", cascade="all, delete-orphan")
    cover_letters: Mapped[List["UserCoverLetter"]] = relationship("UserCoverLetter", back_populates="job")
    user_job_maps: Mapped[List["UserJobMap"]] = relationship("UserJobMap", back_populates="job", cascade="all, delete-orphan")

    @property
    def salary_range(self) -> Optional[str]:
        if self.salary_raw: return self.salary_raw
        if self.salary_min and self.salary_max:
            return f"₹{self.salary_min:,} - ₹{self.salary_max:,}"
        elif self.salary_min:
            return f"₹{self.salary_min:,}+"
        return None

    @property
    def location_display(self) -> str:
        if self.location_raw: return self.location_raw
        parts = [self.location_city, self.location_country]
        return ", ".join([p for p in parts if p])

    def __repr__(self) -> str:
        return f"<Job(id={self.id}, title='{self.title[:50]}...', company='{self.company_name}')>"
