from typing import List, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base import BaseRepository
from app.models.agent import Agent

class AgentRepository(BaseRepository[Agent]):
    """Repository for managing Agent instances."""
    
    def __init__(self, session: AsyncSession):
        super().__init__(session, Agent)

    async def get_by_agent_id(self, agent_id: str) -> Optional[Agent]:
        """Get agent by its unique string ID."""
        stmt = select(Agent).where(Agent.agent_id == agent_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_all_by_user(self, user_id: UUID) -> List[Agent]:
        """Get all agents registered to a user."""
        stmt = select(Agent).where(Agent.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()
