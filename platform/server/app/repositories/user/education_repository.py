from typing import List
from uuid import UUID
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user.education import UserEducation
from app.repositories.base import BaseRepository


class EducationRepository(BaseRepository[UserEducation]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, UserEducation)
    
    async def replace_all(self, user_id: UUID, educations: List[dict]) -> List[UserEducation]:
        # 1. DELETE educations → 1 CALL
        await self.session.execute(delete(UserEducation).where(UserEducation.user_id == user_id))
        
        # 2. BULK INSERT all educations → 1 CALL
        bulk_educations = []
        for i, edu_obj in enumerate(educations):
            edu_data = edu_obj.model_dump() if hasattr(edu_obj, "model_dump") else dict(edu_obj)
            edu_data.pop("display_order", None)
            bulk_educations.append(UserEducation(**edu_data, user_id=user_id, display_order=i))

        self.session.add_all(bulk_educations)
        
        # 3. SINGLE COMMIT → IMPLICIT
        await self.session.flush()
        
        return bulk_educations
    
    async def get_by_user_id(self, user_id: UUID) -> List[UserEducation]:
        query = select(UserEducation).where(UserEducation.user_id == user_id).order_by(UserEducation.display_order)
        result = await self.session.execute(query)
        return result.scalars().all()
