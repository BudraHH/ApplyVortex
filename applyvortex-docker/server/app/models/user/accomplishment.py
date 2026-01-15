from typing import Optional
from uuid import UUID

from sqlalchemy import ForeignKey, String, Text, SmallInteger
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin, UserOwnedMixin, DisplayOrderMixin


class UserAccomplishment(Base, UUIDMixin, TimestampMixin, UserOwnedMixin, DisplayOrderMixin):
    __tablename__ = "user_accomplishments"
    
    user = relationship("User", back_populates="accomplishments")
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Core Data
    title: Mapped[str] = mapped_column(String(200), nullable=False) # "1st Place - Smart India Hackathon"
    category: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
 
    description: Mapped[Optional[str]] = mapped_column(Text) # "Led a team of 4 to build..."

