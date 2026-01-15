"""
Agent API Key Model
Stores API keys for agent authentication.
"""
from typing import Optional
from datetime import datetime
from uuid import UUID
from sqlalchemy import String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin


class AgentAPIKey(Base, UUIDMixin, TimestampMixin):
    """
    API keys for agent authentication.
    Provides secure, revocable access for agents without exposing user passwords.
    """
    __tablename__ = "agent_api_keys"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    
    # Security: Only hash is stored, never the actual key
    key_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Display: First 12 chars for UI (e.g., "apf_agent_a3f4...")
    key_prefix: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    
    # User-friendly name (e.g., "Johns MacBook", "Office Desktop")
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Device Identification
    device_id: Mapped[UUID] = mapped_column(unique=True, nullable=False)
    install_path: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Tracking
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="agent_api_keys")
    agents: Mapped[list["Agent"]] = relationship("Agent", back_populates="api_key")

    def __repr__(self) -> str:
        return f"<AgentAPIKey(id={self.id}, name={self.name}, prefix={self.key_prefix})>"
