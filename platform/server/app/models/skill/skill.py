from typing import List, Optional

from sqlalchemy import String, Text, SmallInteger
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin, VerifiedMixin
from app.constants.constants import SkillsCategory, SkillSubCategory


class Skill(Base, UUIDMixin, TimestampMixin, VerifiedMixin):
    __tablename__ = "skills"
    
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    category: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    sub_category: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=SkillSubCategory.OTHER.value)
    aliases: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text))
