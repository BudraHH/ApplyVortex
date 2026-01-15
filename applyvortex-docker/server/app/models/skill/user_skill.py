from datetime import datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import TimestampMixin, UserOwnedMixin
from app.models.base import Base
from app.models.mixins import TimestampMixin, UserOwnedMixin

if TYPE_CHECKING:
    from app.models.user.user import User
    from app.models.skill.skill import Skill


class UserSkillMap(Base, UserOwnedMixin, TimestampMixin):
    __tablename__ = "user_skill_map"

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    skill_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="RESTRICT"),
        primary_key=True,
    )



    user: Mapped["User"] = relationship("User", back_populates="skills", foreign_keys=[user_id])
    skill: Mapped["Skill"] = relationship("Skill", foreign_keys=[skill_id])

    @property
    def name(self) -> str:
        return self.skill.name if self.skill else ""

    @property
    def id(self) -> str:
        return str(self.skill_id)

    @property
    def category(self) -> int:
        return self.skill.category if self.skill else 0

    @property
    def sub_category(self) -> int:
        return self.skill.sub_category if self.skill else 999


    
    def __repr__(self) -> str:
        return f"<UserSkillMap(user_id={self.user_id}, skill_id={self.skill_id})>"
