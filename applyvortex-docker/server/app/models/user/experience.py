from typing import List, Optional
from uuid import UUID

from sqlalchemy import ForeignKey, String, Integer, Text, ARRAY, Boolean, SmallInteger
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin, UserOwnedMixin, DisplayOrderMixin
from app.constants.constants import JobType, WorkMode

# Forward TYPE_CHECKING reference only
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.skill.experience_skill import UserExperienceSkillMap
    from app.models.user.user import User


class UserExperience(Base, UUIDMixin, TimestampMixin, UserOwnedMixin, DisplayOrderMixin):
    user = relationship("User", back_populates="experiences")
    __tablename__ = "user_experiences"
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_title: Mapped[str] = mapped_column(String(200), nullable=False)
    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    
    work_mode: Mapped[int] = mapped_column(SmallInteger, default=WorkMode.ONSITE.value)
    city: Mapped[Optional[str]] = mapped_column(String(100))
    state: Mapped[Optional[str]] = mapped_column(String(100))
    country: Mapped[str] = mapped_column(String(100), default='India')

    start_month: Mapped[int] = mapped_column(Integer, nullable=False)
    start_year: Mapped[int] = mapped_column(Integer, nullable=False)
    end_month: Mapped[Optional[int]] = mapped_column(Integer)
    end_year: Mapped[Optional[int]] = mapped_column(Integer)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)
    
    employment_type: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    job_summary: Mapped[Optional[str]] = mapped_column(Text)
    # key_responsibilities removed

    achievements: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text))


    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="experiences"
    )
    
    # String reference prevents circular import
    skills: Mapped[List["UserExperienceSkillMap"]] = relationship(
        "UserExperienceSkillMap",
        back_populates="experience",
        cascade="all, delete-orphan"
    )

    @property
    def is_ongoing(self) -> bool:
        return self.is_current

    @property
    def start_date(self) -> str:
        return f"{self.start_month}/{self.start_year}"

    @property
    def end_date(self) -> Optional[str]:
        if self.is_current:
            return "Present"
        elif self.end_month and self.end_year:
            return f"{self.end_month}/{self.end_year}"
        return None

    @property
    def skills_payload(self):
        return [
            {"id": m.skill.id, "name": m.skill.name} 
            for m in self.skills 
            if m.skill
        ]
