from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.job.job_match import JobMatchAnalysis
from app.repositories.base import BaseRepository

class JobMatchRepository(BaseRepository[JobMatchAnalysis]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, JobMatchAnalysis)

    async def get_by_user_and_job(self, user_id: UUID, job_id: UUID) -> Optional[JobMatchAnalysis]:
        stmt = select(self.model).where(
            and_(
                self.model.user_id == user_id,
                self.model.job_id == job_id
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user(self, user_id: UUID, limit: int = 50) -> List[JobMatchAnalysis]:
        stmt = select(self.model).where(
            self.model.user_id == user_id
        ).order_by(self.model.overall_match.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

