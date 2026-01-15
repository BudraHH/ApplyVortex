from uuid import UUID

from sqlalchemy import String, ForeignKey, SmallInteger
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin, UserOwnedMixin
from app.constants.constants import LanguageAbility

from app.constants.constants import LanguageAbility, LanguageProficiency


class UserLanguage(Base, UUIDMixin, TimestampMixin, UserOwnedMixin):
    user = relationship("User", back_populates="languages")
    __tablename__ = "user_languages"
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    language: Mapped[str] = mapped_column(String(100), nullable=False)
    proficiency: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    ability: Mapped[int] = mapped_column(SmallInteger, default=LanguageAbility.BOTH.value, nullable=False)
    
    @property
    def proficiency_display(self) -> str:
        try:
            return LanguageProficiency(self.proficiency).name.replace('_', ' ').title()
        except ValueError:
            return str(self.proficiency)
    
    @property
    def ability_display(self) -> str:
        try:
            return LanguageAbility(self.ability).name.replace('_', ' ').title()
        except ValueError:
            return str(self.ability)
