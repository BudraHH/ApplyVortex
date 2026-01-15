from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user.certification_repository import CertificationRepository
from app.schemas.user.certifications import (
    BulkCertificationCreate, 
    BulkCertificationResponse, 
    CertificationResponse
)

from app.repositories.user.notification_repository import NotificationRepository
from app.constants.constants import NotificationType
from app.services.cache.redis_service import redis_service, cached

class CertificationService:
    def __init__(
        self, 
        db: AsyncSession = None, 
        certification_repo: CertificationRepository = None,
        notification_repo: NotificationRepository = None
    ):
        self.db = db
        self.certification_repo = certification_repo or CertificationRepository(db)
        self.notification_repo = notification_repo or NotificationRepository(db)
    
    async def replace_all(self, user_id: UUID, data: BulkCertificationCreate) -> BulkCertificationResponse:
        """Replace ALL certifications (resume parser UX)"""
        certifications = await self.certification_repo.replace_all(user_id, data.certifications)
        await self.db.commit()
        
        # Raise notification
        await self.notification_repo.create_notification(
            user_id=user_id,
            type=NotificationType.SYSTEM,
            title="Certifications Updated",
            message="Your certifications have been successfully updated.",
            action_url="/profile-setup?tab=certifications",
            metadata={"source": "manual_edit", "category": "certifications"}
        )
        
        # Invalidate Cache
        await redis_service.delete(f"cache:user:{user_id}:certifications")

        return BulkCertificationResponse(
            certifications=[CertificationResponse.model_validate(cert) for cert in certifications],
            total_count=len(certifications)
        )
    
    @cached(ttl_seconds=3600, key_builder=lambda f, self, user_id: f"cache:user:{user_id}:certifications", response_model=BulkCertificationResponse)
    async def get_all(self, user_id: UUID) -> BulkCertificationResponse:
        """Get ALL user certifications"""
        certifications = await self.certification_repo.get_by_user_id(user_id)
        return BulkCertificationResponse(
            certifications=[CertificationResponse.model_validate(cert) for cert in certifications],
            total_count=len(certifications)
        )
    
    async def get_valid_certifications(self, user_id: UUID) -> List[CertificationResponse]:
        """Get only non-expired certifications for profile display"""
        valid_certs = await self.certification_repo.get_valid_certifications(user_id)
        return [CertificationResponse.model_validate(cert) for cert in valid_certs]
    
    async def get_expired_certifications(self, user_id: UUID) -> List[CertificationResponse]:
        """Get expired certifications (renewal reminders)"""
        all_certs = await self.certification_repo.get_by_user_id(user_id)
        expired = [c for c in all_certs if not c.is_valid and not c.does_not_expire]
        return [CertificationResponse.model_validate(cert) for cert in expired]
