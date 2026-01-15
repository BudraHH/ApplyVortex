from decimal import Decimal
from typing import List, Optional, TYPE_CHECKING
from uuid import UUID

from sqlalchemy import String, ARRAY, Numeric, Boolean, ForeignKey, Computed, UniqueConstraint, Text, SmallInteger
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin, UserOwnedMixin
from app.constants.constants import JobMatchQuality

if TYPE_CHECKING:
    from .job import Job


class JobMatchAnalysis(Base, UUIDMixin, TimestampMixin, UserOwnedMixin):
    __tablename__ = "job_match_analysis"
    __table_args__ = (
        UniqueConstraint('user_id', 'job_id', name='idx_job_match_analysis_unique'),
    )

    # Job Reference
    job_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Composite Match Scores (0.0000 - 1.0000)
    overall_match: Mapped[Decimal] = mapped_column(
        Numeric(5, 4),
        nullable=False
    )
    skill_match: Mapped[Decimal] = mapped_column(Numeric(5, 4))
    experience_match: Mapped[Decimal] = mapped_column(Numeric(5, 4))
    location_match: Mapped[Decimal] = mapped_column(Numeric(5, 4))
    salary_match: Mapped[Decimal] = mapped_column(Numeric(5, 4))

    # Reasoning & Explanation
    matched_skills: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String))
    missing_skills: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String))
    skill_gap_recommendations: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String))
    
    analysis_notes: Mapped[Optional[str]] = mapped_column(Text)

    # Match Quality Tiers (computed)
    # Match Quality
    match_quality: Mapped[int] = mapped_column(
        SmallInteger,
        default=JobMatchQuality.WEAK.value
    )

    # Confidence & Model Info
    confidence_score: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4))
    model_version: Mapped[Optional[str]] = mapped_column(String(50))

    # Relationships
    job: Mapped["Job"] = relationship(
        "Job",
        back_populates="match_scores",
        foreign_keys=[job_id]
    )

    @property
    def should_apply(self) -> bool:
        """Strong matches worth applying immediately."""
        return self.match_quality == JobMatchQuality.STRONG

    @property
    def skill_gap_count(self) -> int:
        """Number of missing skills."""
        return len(self.missing_skills) if self.missing_skills else 0

    @property
    def matched_skill_count(self) -> int:
        """Number of matched skills."""
        return len(self.matched_skills) if self.matched_skills else 0

    def update_scores(
            self,
            overall: Decimal,
            skill: Decimal,
            experience: Decimal,
            location: Decimal,
            salary: Decimal
    ) -> None:
        """Update all match scores."""
        self.overall_match = overall
        self.skill_match = skill
        self.experience_match = experience
        self.location_match = location
        self.salary_match = salary

    def __repr__(self) -> str:
        return (f"<JobMatchAnalysis(id={self.id}, user_id={self.user_id}, "
                f"job_id={self.job_id}, overall={self.overall_match})>")
