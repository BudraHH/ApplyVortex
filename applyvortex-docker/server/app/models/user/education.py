from typing import List, Optional
from uuid import UUID

from sqlalchemy import String, Integer, Text, ARRAY, Boolean, ForeignKey, SmallInteger
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin, UserOwnedMixin, DisplayOrderMixin
from app.constants.constants import (
    EducationLevel, EducationStatus
)


class UserEducation(Base, UUIDMixin, TimestampMixin, UserOwnedMixin, DisplayOrderMixin):
    user = relationship("User", back_populates="educations")
    __tablename__ = "user_educations"
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    degree_type: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    degree_name: Mapped[str] = mapped_column(String(200), nullable=False)
    field_of_study: Mapped[str] = mapped_column(String(200), nullable=False)
    
    institution_name: Mapped[str] = mapped_column(String(200), nullable=False)
    university_name: Mapped[Optional[str]] = mapped_column(String(200))
    
    start_month: Mapped[int] = mapped_column(Integer, nullable=False)
    start_year: Mapped[int] = mapped_column(Integer, nullable=False)
    end_month: Mapped[Optional[int]] = mapped_column(Integer)
    end_year: Mapped[Optional[int]] = mapped_column(Integer)
    expected_graduation_month: Mapped[Optional[int]] = mapped_column(Integer)
    expected_graduation_year: Mapped[Optional[int]] = mapped_column(Integer)
    no_of_years: Mapped[Optional[int]] = mapped_column(Integer)
    
    city: Mapped[Optional[str]] = mapped_column(String(100))
    state: Mapped[Optional[str]] = mapped_column(String(100))
    country: Mapped[Optional[str]] = mapped_column(String(100), default='India')
    
    grade_type: Mapped[Optional[int]] = mapped_column(SmallInteger)
    grade_value: Mapped[Optional[str]] = mapped_column(String(20))
    grade_scale: Mapped[Optional[str]] = mapped_column(String(20))
    
    relevant_coursework: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text))
    
    thesis_title: Mapped[Optional[str]] = mapped_column(String(300))
    thesis_description: Mapped[Optional[str]] = mapped_column(Text)
    research_areas: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text))
    publications: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text))

    description: Mapped[Optional[str]] = mapped_column(Text)
    
    # activities, societies, achievements, honors_awards removed

    
    status: Mapped[int] = mapped_column(SmallInteger, default=EducationStatus.COMPLETED.value)
    
    @property
    def is_ongoing(self) -> bool:
        return self.status == EducationStatus.IN_PROGRESS.value
    
    @property
    def start_date(self) -> str:
        return f"{self.start_month}/{self.start_year}"
    
    @property
    def end_date(self) -> Optional[str]:
        if self.status == EducationStatus.IN_PROGRESS.value:
            return "Present"
        elif self.end_month and self.end_year:
            return f"{self.end_month}/{self.end_year}"
        return None
    
    @property
    def grade_display(self) -> Optional[str]:
        if self.grade_value and self.grade_type:
            return f"{self.grade_value} ({self.grade_type})"
        return None
