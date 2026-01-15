from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user.language_repository import LanguageRepository
from app.schemas.user.language import (
    BulkLanguageCreate, 
    BulkLanguageResponse, 
    LanguageResponse
)

from app.repositories.user.notification_repository import NotificationRepository
from app.constants.constants import NotificationType

class LanguageService:
    def __init__(
        self, 
        db: AsyncSession = None, 
        language_repo: LanguageRepository = None,
        notification_repo: NotificationRepository = None
    ):
        self.db = db
        self.language_repo = language_repo or LanguageRepository(db)
        self.notification_repo = notification_repo or NotificationRepository(db)
    
    async def replace_all(self, user_id: UUID, data: BulkLanguageCreate) -> BulkLanguageResponse:
        """Replace ALL languages (resume parser UX)"""
        languages = await self.language_repo.replace_all(user_id, data.languages)
        await self.db.commit()
        
        # Raise notification
        await self.notification_repo.create_notification(
            user_id=user_id,
            type=NotificationType.SYSTEM,
            title="Languages Updated",
            message="Your language proficiency details have been successfully updated.",
            metadata={"source": "manual_edit", "category": "languages"}
        )
        
        return BulkLanguageResponse(
            languages=[LanguageResponse.model_validate(lang) for lang in languages],
            total_count=len(languages)
        )
    
    async def get_all(self, user_id: UUID) -> BulkLanguageResponse:
        """Get ALL user languages"""
        languages = await self.language_repo.get_by_user_id(user_id)
        return BulkLanguageResponse(
            languages=[LanguageResponse.model_validate(lang) for lang in languages],
            total_count=len(languages)
        )
    
    async def get_primary_language(self, user_id: UUID) -> LanguageResponse:
        """Get primary/native language for profile summary"""
        languages = await self.language_repo.get_by_user_id(user_id)
        if not languages:
            raise HTTPException(status_code=404, detail="No languages found")
        
        # Prioritize native > fluent > professional
        primary = next((lang for lang in languages if lang.proficiency == "native"), languages[0])
        return LanguageResponse.model_validate(primary)
