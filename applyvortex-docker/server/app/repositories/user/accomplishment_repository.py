from typing import List, Optional
from uuid import UUID
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user.accomplishment import UserAccomplishment
from app.repositories.base import BaseRepository

class AccomplishmentRepository(BaseRepository[UserAccomplishment]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, UserAccomplishment)
    
    async def get_by_user_id(self, user_id: UUID) -> List[UserAccomplishment]:
        query = select(UserAccomplishment).where(UserAccomplishment.user_id == user_id).order_by(UserAccomplishment.display_order.asc())
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def replace_all(self, user_id: UUID, accomplishments: List[dict]) -> List[UserAccomplishment]:
        # 1. DELETE existing entries for user
        await self.session.execute(delete(UserAccomplishment).where(UserAccomplishment.user_id == user_id))
        
        # 2. BULK INSERT new entries
        bulk_items = []
        for index, item_obj in enumerate(accomplishments):
            item_data = item_obj.model_dump() if hasattr(item_obj, "model_dump") else dict(item_obj)
            # Assign display order based on list position
            item_data['display_order'] = index
            bulk_items.append(UserAccomplishment(**item_data, user_id=user_id))
            
        self.session.add_all(bulk_items)
        await self.session.flush()
        
        return bulk_items
