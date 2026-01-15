from typing import Optional
from uuid import UUID
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user.profile import UserProfile
from app.repositories.base import BaseRepository


class ProfileRepository(BaseRepository[UserProfile]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, UserProfile)
    
    async def get_by_user_id(self, user_id: UUID) -> Optional[UserProfile]:
        query = select(UserProfile).where(UserProfile.user_id == user_id)
        result = await self.session.execute(query)
        return result.scalars().first()
    
    async def create_or_update_profile(self, user_id: UUID, profile_data: dict) -> UserProfile:
        existing_profile = await self.get_by_user_id(user_id)
        if existing_profile:
            for key, value in profile_data.items():
                setattr(existing_profile, key, value)
            await self.session.flush()
            await self.session.refresh(existing_profile)
            return existing_profile
        else:
            profile = UserProfile(user_id=user_id, **profile_data)
            self.session.add(profile)
            await self.session.flush()
            await self.session.refresh(profile)
            return profile
    
    async def delete_by_user_id(self, user_id: UUID) -> int:
        query = delete(UserProfile).where(UserProfile.user_id == user_id)
        result = await self.session.execute(query)
        await self.session.flush()
        return result.rowcount
