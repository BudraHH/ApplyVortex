from uuid import UUID, uuid4
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.user.experience import UserExperience
    from app.models.skill.skill import Skill


class UserExperienceSkillMap(Base, UUIDMixin):
    __tablename__ = "user_experience_skill_map"

    user_experience_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_experiences.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    skill_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    # Composite unique constraint
    __table_args__ = (
        UniqueConstraint("user_experience_id", "skill_id", name="user_experience_skill_map_unique"),
        {"sqlite_autoincrement": False},  # Disable SQLite auto-increment
    )

    experience: Mapped["UserExperience"] = relationship(
        "UserExperience",
        back_populates="skills",
        foreign_keys=[user_experience_id]
    )
    skill: Mapped["Skill"] = relationship(
        "Skill",
        foreign_keys=[skill_id]
    )

    def __repr__(self) -> str:
        return f"<UserExperienceSkillMap(id={self.id}, experience_id={self.user_experience_id}, skill_id={self.skill_id})>"
