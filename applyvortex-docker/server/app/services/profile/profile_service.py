from __future__ import annotations
from typing import Dict, Any, Optional, TYPE_CHECKING
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.repositories.user.profile_repository import ProfileRepository
from app.schemas.user.profile import (
    ProfileCreate, 
    ProfileResponse, 
    ProfileUpdate
)
from app.core.exceptions import UserNotFound

if TYPE_CHECKING:
    from app.services.profile.complete_service import CompleteProfileService
from app.models.user.language import UserLanguage
from app.models.user.user import User


from app.repositories.user.notification_repository import NotificationRepository
from app.constants.constants import NotificationType
from app.services.cache.redis_service import redis_service, cached

class ProfileService:
    def __init__(
        self, 
        db: AsyncSession = None, 
        profile_repo: ProfileRepository = None,
        complete_service: CompleteProfileService = None,
        notification_repo: NotificationRepository = None
    ):
        self.db = db
        self.profile_repo = profile_repo or ProfileRepository(db)
        self.complete_service = complete_service
        self.notification_repo = notification_repo or NotificationRepository(db)
    
    @cached(ttl_seconds=3600, key_builder=lambda f, self, user_id: f"cache:user:{user_id}:profile", response_model=ProfileResponse)
    async def get_profile(self, user_id: UUID) -> ProfileResponse:
        """Get basic user profile from user_profiles table"""
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            raise UserNotFound("Profile not found")
        
        # Fetch user languages and email
        result = await self.db.execute(
            select(UserLanguage).where(UserLanguage.user_id == user_id)
        )
        languages = result.scalars().all()

        # Fetch user email
        user_result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        email = user.email if user else ""
        
        # Build response dict directly from ORM object (no validation on read)
        profile_dict = {
            'email': email,
            'first_name': profile.first_name,
            'middle_name': profile.middle_name,
            'last_name': profile.last_name,
            'gender': profile.gender.value if hasattr(profile.gender, 'value') else profile.gender,
            'phone_number': profile.phone_number,
            'phone_country_code': profile.phone_country_code,
            'alternate_phone': profile.alternate_phone,
            'alternate_phone_country_code': profile.alternate_phone_country_code,
            'current_address': profile.current_address,
            'current_city': profile.current_city,
            'current_state': profile.current_state,
            'current_country': profile.current_country,
            'current_postal_code': profile.current_postal_code,
            'permanent_address': profile.permanent_address,
            'permanent_city': profile.permanent_city,
            'permanent_state': profile.permanent_state,
            'permanent_country': profile.permanent_country,
            'permanent_postal_code': profile.permanent_postal_code,
            'willing_to_relocate': profile.willing_to_relocate,
            'headline': profile.headline,
            'professional_summary': profile.professional_summary,
            'current_role': profile.current_role,
            'current_company': profile.current_company,
            'years_of_experience': float(profile.years_of_experience) if profile.years_of_experience else 0.0,
            'preferred_work_mode': profile.preferred_work_mode,
            'job_search_status': profile.job_search_status.value if hasattr(profile.job_search_status, 'value') else profile.job_search_status,
            'availability': profile.availability.value if hasattr(profile.availability, 'value') else profile.availability,
            'notice_period_days': profile.notice_period_days,
            'expected_salary_min': profile.expected_salary_min,
            'expected_salary_max': profile.expected_salary_max,
            'salary_currency': profile.salary_currency,
            'github_url': profile.github_url,
            'linkedin_url': profile.linkedin_url,
            'portfolio_url': profile.portfolio_url,
            'leetcode_url': profile.leetcode_url,
            'naukri_url': profile.naukri_url,
            'stackoverflow_url': profile.stackoverflow_url,
            'medium_url': profile.medium_url,
            'personal_website': profile.personal_website,
            'profile_completeness': profile.profile_completeness,
            'timezone': profile.timezone,
            'date_format': profile.date_format,
            'last_updated_at': profile.last_updated_at,
            'languages': [
                {
                    'name': lang.language,
                    'proficiency': lang.proficiency.value if hasattr(lang.proficiency, 'value') else lang.proficiency,
                    'ability': lang.ability.value if hasattr(lang.ability, 'value') else lang.ability
                }
                for lang in languages
            ]
        }
        
        return ProfileResponse(**profile_dict)

    
    async def update_profile(
        self, 
        user_id: UUID, 
        profile_data: ProfileCreate | ProfileUpdate
    ) -> ProfileResponse:
        """Update profile info (name, headline, social links, etc.)"""
        profile_dict = profile_data.model_dump(exclude_unset=True)
        
        # Extract languages from profile_dict
        languages_data = profile_dict.pop('languages', None)
        
        # Update profile
        profile = await self.profile_repo.create_or_update_profile(user_id, profile_dict)
        
        # Raise notification
        await self.notification_repo.create_notification(
            user_id=user_id,
            type=NotificationType.SYSTEM.value,
            title="Profile Information Updated",
            message="Your profile information has been successfully updated.",
            action_url="/profile-setup",
            metadata={"source": "manual_edit", "category": "personal_info"}
        )
        
        # Handle languages if provided
        if languages_data is not None:
            await self._update_user_languages(user_id, languages_data)
        else:
            await self.db.commit()
        
        # Invalidate Cache
        await redis_service.delete(f"cache:user:{user_id}:profile")

        return await self.get_profile(user_id)
    
    async def _update_user_languages(self, user_id: UUID, languages_data: list):
        """Update user languages - delete existing and create new ones"""
        # Delete existing languages
        await self.db.execute(
            delete(UserLanguage).where(UserLanguage.user_id == user_id)
        )
        
        # Create new language entries
        if languages_data:
            for lang_data in languages_data:
                if lang_data.get('name'):  # Only create if name is provided
                    language = UserLanguage(
                        user_id=user_id,
                        language=lang_data['name'],
                        proficiency=lang_data.get('proficiency', 'intermediate'),
                        ability=lang_data.get('ability', 'both')
                    )
                    self.db.add(language)
        
        await self.db.commit()
    
    async def calculate_completeness(self, user_id: UUID, profile_obj: Optional[Any] = None) -> int:
        """Calculate profile completeness score (0-100)"""
        profile = profile_obj
        if not profile:
            profile = await self.profile_repo.get_by_user_id(user_id)
        
        if not profile:
            return 0
        
        score = 0
        
        # Basic info (30 points)
        if profile.first_name and profile.last_name:
            score += 15
        if profile.phone_number or profile.current_city:
            score += 15
        
        # Professional info (30 points)
        if profile.headline:
            score += 15
        if profile.professional_summary:
            score += 15
        
        # Work experience (20 points)
        if profile.current_role or profile.current_company:
            score += 10
        if profile.years_of_experience and profile.years_of_experience > 0:
            score += 10
        
        # Social links (10 points)
        social_links = sum([
            bool(getattr(profile, 'github_url', None)),
            bool(getattr(profile, 'linkedin_url', None)),
            bool(getattr(profile, 'portfolio_url', None))
        ])
        score += min(social_links * 3, 10)
        
        # Location (10 points)
        if profile.current_city or profile.current_state or profile.current_country:
            score += 10
        
        return min(score, 100)
    
    async def get_complete_profile(self, user_id: UUID) -> Dict[str, Any]:
        """Get complete profile (admin/export - calls complete_service)"""
        if not self.complete_service:
            from app.services.profile.complete_service import CompleteProfileService
            # In production, this should be injected. Fallback for ad-hoc use.
            self.complete_service = CompleteProfileService(db=self.db, profile_service=self)
            
        return await self.complete_service.get_complete_profile(user_id)
