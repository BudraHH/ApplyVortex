from typing import List, Optional
from uuid import UUID

from sqlalchemy import ForeignKey, String, Integer, Text, Boolean, ARRAY, SmallInteger
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin, UserOwnedMixin, DisplayOrderMixin, FeaturedMixin
from app.constants.constants import ProjectStatus, ProjectType

# Forward TYPE_CHECKING reference only
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.skill.project_skill import UserProjectSkillMap


class UserProject(Base, UUIDMixin, TimestampMixin, UserOwnedMixin, DisplayOrderMixin, FeaturedMixin):
    user = relationship("User", back_populates="projects")
    __tablename__ = "user_projects"
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_name: Mapped[str] = mapped_column(String(200), nullable=False)
    project_type: Mapped[int] = mapped_column(SmallInteger, default=ProjectType.PERSONAL.value, nullable=False)
    status: Mapped[int] = mapped_column(SmallInteger, default=ProjectStatus.COMPLETED.value)

    short_description: Mapped[Optional[str]] = mapped_column(String(500))
    detailed_description: Mapped[Optional[str]] = mapped_column(Text)


    start_month: Mapped[Optional[int]] = mapped_column(Integer)
    start_year: Mapped[Optional[int]] = mapped_column(Integer)
    end_month: Mapped[Optional[int]] = mapped_column(Integer)
    end_year: Mapped[Optional[int]] = mapped_column(Integer)

    github_url: Mapped[Optional[str]] = mapped_column(String(500))
    live_url: Mapped[Optional[str]] = mapped_column(String(500))
    documentation_url: Mapped[Optional[str]] = mapped_column(String(500))

    # key_features removed

    # challenges_faced removed

    # String reference prevents circular import
    skills: Mapped[List["UserProjectSkillMap"]] = relationship(
        "UserProjectSkillMap",
        back_populates="project",
        cascade="all, delete-orphan"
    )

    @property
    def is_active(self) -> bool:
        return self.status == ProjectStatus.IN_PROGRESS.value or self.status == ProjectStatus.COMPLETED.value

    @property
    def skills_payload(self):
        """Flattened skills list for Pydantic serialization"""
        return [
            {"id": mapping.skill.id, "name": mapping.skill.name}
            for mapping in self.skills 
            if mapping.skill
        ]

    @property
    def start_date(self) -> Optional[str]:
        if self.start_month and self.start_year:
            return f"{self.start_month}/{self.start_year}"
        return None

    @property
    def end_date(self) -> Optional[str]:
        if self.status == ProjectStatus.IN_PROGRESS.value:
            return "Ongoing"
        elif self.end_month and self.end_year:
            return f"{self.end_month}/{self.end_year}"
        return None
