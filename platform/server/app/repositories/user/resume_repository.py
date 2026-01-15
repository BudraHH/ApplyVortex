from typing import List, Optional
from uuid import UUID
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from app.models.user.resume import UserResume
from app.repositories.base import BaseRepository
from app.constants.constants import ParsingStatus


class ResumeRepository(BaseRepository[UserResume]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, UserResume)
    
    async def replace_all(self, user_id: UUID, resumes: List[dict]) -> List[UserResume]:
        # 1. DELETE resumes → 1 CALL
        await self.session.execute(delete(UserResume).where(UserResume.user_id == user_id))
        
        # 2. BULK INSERT all resumes → 1 CALL
        bulk_resumes = [UserResume(**resume, user_id=user_id) for resume in resumes]
        self.session.add_all(bulk_resumes)
        
        # 3. SINGLE COMMIT → IMPLICIT
        await self.session.flush()
        
        return bulk_resumes
    
    async def get_by_user_id(self, user_id: UUID, active_only: bool = True) -> List[UserResume]:
        query = select(UserResume).where(UserResume.user_id == user_id)
        if active_only:
            query = query.where(UserResume.is_active == True)
        query = query.order_by(UserResume.is_default.desc(), UserResume.last_used_at.desc().nulls_last())
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def get_default_resume(self, user_id: UUID) -> UserResume:
        query = select(UserResume).where(
            UserResume.user_id == user_id,
            UserResume.is_default == True,
            UserResume.is_active == True
        )
        result = await self.session.execute(query)
        return result.scalars().first()
    
    async def set_default_resume(self, resume_id: UUID, user_id: UUID) -> UserResume:
        # Clear all defaults
        await self.session.execute(
            update(UserResume)
            .where(UserResume.user_id == user_id, UserResume.is_default == True)
            .values(is_default=False)
        )
        # Set new default
        await self.session.execute(
            update(UserResume)
            .where(UserResume.id == resume_id)
            .values(is_default=True)
        )
        await self.session.flush()
        return await self.get(resume_id)
    
    async def update_parsing_status(
        self, 
        resume_id: UUID, 
        status: int, 
        error: Optional[str] = None
    ) -> UserResume:
        """Update parsing status and timestamps"""
        values = {
            'parsing_status': status,
            'parsing_error': error
        }
        
        
        if status == ParsingStatus.PROCESSING.value:
            values['parsing_started_at'] = datetime.now()
        elif status in [ParsingStatus.SUCCESS.value, ParsingStatus.FAILED.value]:
            values['parsing_completed_at'] = datetime.now()
        
        await self.session.execute(
            update(UserResume)
            .where(UserResume.id == resume_id)
            .values(**values)
        )
        await self.session.flush()
        return await self.get(resume_id)
    
    async def update_parsed_data(
        self, 
        resume_id: UUID, 
        parsed_data: dict, 
        status: int = ParsingStatus.SUCCESS.value
    ) -> UserResume:
        """Update parsed data and set status to completed"""
        await self.session.execute(
            update(UserResume)
            .where(UserResume.id == resume_id)
            .values(
                parsed_data=parsed_data,
                parsing_status=status,
                parsing_completed_at=datetime.now()
            )
        )
        await self.session.flush()
        return await self.get(resume_id)
    async def delete(self, resume_id: UUID) -> bool:
        """Override delete to use direct SQL delete statement"""
        await self.session.execute(
            delete(UserResume).where(UserResume.id == resume_id)
        )
        await self.session.flush()
        return True
