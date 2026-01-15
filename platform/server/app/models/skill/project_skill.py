from uuid import UUID, uuid4
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user.project import UserProject
    from app.models.skill.skill import Skill


class UserProjectSkillMap(Base, UUIDMixin):
    __tablename__ = "user_project_skill_map"

    user_project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_projects.id", ondelete="CASCADE"),
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
        UniqueConstraint("user_project_id", "skill_id", name="user_project_skill_map_unique"),
        {"sqlite_autoincrement": False},  # Disable SQLite auto-increment
    )

    project: Mapped["UserProject"] = relationship(
        "UserProject",
        back_populates="skills",
        foreign_keys=[user_project_id]
    )
    skill: Mapped["Skill"] = relationship(
        "Skill",
        foreign_keys=[skill_id]
    )
