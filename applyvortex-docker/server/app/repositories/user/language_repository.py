from typing import List
from uuid import UUID
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user.language import UserLanguage
from app.repositories.base import BaseRepository


class LanguageRepository(BaseRepository[UserLanguage]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, UserLanguage)
    
    async def replace_all(self, user_id: UUID, languages: List[dict]) -> List[UserLanguage]:
        # 1. DELETE languages → 1 CALL
        await self.session.execute(delete(UserLanguage).where(UserLanguage.user_id == user_id))
        
        # 2. BULK INSERT all languages → 1 CALL
        bulk_languages = []
        for lang in languages:
            # Convert Pydantic to dict if needed
            lang_data = lang.model_dump() if hasattr(lang, "model_dump") else dict(lang)
            bulk_languages.append(UserLanguage(**lang_data, user_id=user_id))
        
        self.session.add_all(bulk_languages)
        
        # 3. SINGLE COMMIT → IMPLICIT
        await self.session.flush()
        
        return bulk_languages
    
    async def get_by_user_id(self, user_id: UUID) -> List[UserLanguage]:
        query = select(UserLanguage).where(UserLanguage.user_id == user_id)
        result = await self.session.execute(query)
        return result.scalars().all()
