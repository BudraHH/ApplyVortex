from typing import Optional
from uuid import UUID

from sqlalchemy import ForeignKey, String, Text, Integer, SmallInteger
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin, UserOwnedMixin, DisplayOrderMixin


class UserResearch(Base, UUIDMixin, TimestampMixin, UserOwnedMixin, DisplayOrderMixin):
    __tablename__ = "user_research"
    
    user = relationship("User", back_populates="research")
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    
    # Core Data
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    research_type: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    authors: Mapped[str] = mapped_column(String(300), nullable=False)
    publisher: Mapped[str] = mapped_column(String(200), nullable=False)  # venue/publisher
    
    # Publication Date
    publication_month: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    publication_year: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Additional Info
    url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # DOI or publication URL
    abstract: Mapped[str] = mapped_column(Text, nullable=False)
