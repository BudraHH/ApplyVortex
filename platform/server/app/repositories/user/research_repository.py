from typing import List, Optional, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.user.research import UserResearch
from app.schemas.user.research import ResearchCreate, ResearchUpdate
from app.repositories.base import BaseRepository


class ResearchRepository(BaseRepository[UserResearch]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, UserResearch)

    async def get_by_user_id(self, user_id: UUID) -> List[UserResearch]:
        """Get all research publications for a user, ordered by display_order"""
        stmt = (
            select(UserResearch)
            .where(UserResearch.user_id == user_id)
            .order_by(UserResearch.display_order, UserResearch.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_research(self, user_id: UUID, data: ResearchCreate) -> UserResearch:
        """Create a new research publication"""
        research = UserResearch(
            user_id=user_id,
            **data.model_dump()
        )
        self.session.add(research)
        await self.session.flush()
        return research

    async def update_research(self, research_id: UUID, data: ResearchUpdate) -> Optional[UserResearch]:
        """Update an existing research publication"""
        research = await self.session.get(UserResearch, research_id)
        if not research:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(research, field, value)
        
        await self.session.flush()
        return research

    async def delete_research(self, research_id: UUID) -> bool:
        """Delete a research publication"""
        research = await self.session.get(UserResearch, research_id)
        if not research:
            return False
        
        await self.session.delete(research)
        await self.session.flush()
        return True

    async def replace_all(self, user_id: UUID, research_list: List[Any]) -> List[UserResearch]:
        """Replace all research publications for a user"""
        # Delete existing research
        await self.session.execute(
            delete(UserResearch).where(UserResearch.user_id == user_id)
        )
        
        # Create new research
        new_research = []
        for idx, research_obj in enumerate(research_list):
            research_data = research_obj.model_dump() if hasattr(research_obj, "model_dump") else dict(research_obj)
            research_data.pop("display_order", None)
            
            research = UserResearch(
                user_id=user_id,
                display_order=idx,
                **research_data
            )
            self.session.add(research)
            new_research.append(research)
        
        await self.session.flush()
        return new_research
