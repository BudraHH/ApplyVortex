from typing import List
from uuid import UUID
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user.certification import UserCertification
from app.repositories.base import BaseRepository
from datetime import date


class CertificationRepository(BaseRepository[UserCertification]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, UserCertification)
    
    async def replace_all(self, user_id: UUID, certifications: List[dict]) -> List[UserCertification]:
        # 1. DELETE certifications (CASCADE if any) → 1 CALL
        await self.session.execute(delete(UserCertification).where(UserCertification.user_id == user_id))
        
        # 2. BULK INSERT all certifications → 1 CALL
        bulk_certifications = []
        for cert_obj in certifications:
            cert_data = cert_obj.model_dump() if hasattr(cert_obj, "model_dump") else dict(cert_obj)
            bulk_certifications.append(UserCertification(**cert_data, user_id=user_id))
            
        self.session.add_all(bulk_certifications)
        
        # 3. SINGLE COMMIT → IMPLICIT
        await self.session.flush()
        
        return bulk_certifications
    
    async def get_by_user_id(self, user_id: UUID) -> List[UserCertification]:
        query = select(UserCertification).where(UserCertification.user_id == user_id)
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def get_valid_certifications(self, user_id: UUID) -> List[UserCertification]:
        query = select(UserCertification).where(
            and_(
                UserCertification.user_id == user_id,
                or_(
                    UserCertification.does_not_expire == True,
                    UserCertification.expiry_date >= date.today()
                )
            )
        )
        result = await self.session.execute(query)
        return result.scalars().all()
