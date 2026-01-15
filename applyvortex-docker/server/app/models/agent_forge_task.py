from typing import Dict, Any, Optional
from uuid import UUID
from sqlalchemy import String, JSON, ForeignKey, SmallInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin, UserOwnedMixin
from app.constants.constants import TaskStatus, TaskPriority


class AgentForgeTask(Base, UUIDMixin, TimestampMixin, UserOwnedMixin):
    """
    Tasks queued for the local Agent Forge runner.
    """
    __tablename__ = "agent_forge_tasks"

    task_type: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    status: Mapped[int] = mapped_column(SmallInteger, default=TaskStatus.PENDING.value, index=True)
    priority: Mapped[int] = mapped_column(SmallInteger, default=TaskPriority.MEDIUM.value)
    
    # Link to blueprint
    blueprint_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("user_blueprints.id"), nullable=True)
    
    # Input data for the task (e.g., {"url": "...", "keywords": "..."})
    payload: Mapped[Dict[str, Any]] = mapped_column(JSON, default={})
    
    # Output result from the agent
    result: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Error message if failed
    error_log: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Agent assignment tracking
    assigned_agent_id: Mapped[Optional[str]] = mapped_column(ForeignKey("agents.id"), nullable=True)

    # Relationships
    assigned_agent: Mapped[Optional["Agent"]] = relationship(
        "Agent", 
        back_populates="tasks",
        foreign_keys="[AgentForgeTask.assigned_agent_id]"
    )

    def __repr__(self) -> str:
        return f"<AgentForgeTask(id={self.id}, type={self.task_type}, status={self.status})>"
