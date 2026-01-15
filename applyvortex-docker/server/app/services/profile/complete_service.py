from __future__ import annotations
from typing import Dict, Any, TYPE_CHECKING
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
import asyncio
import logging

from app.services.profile import ExperienceService, ProjectService, EducationService, CertificationService, \
    ResumeService, LanguageService

logger = logging.getLogger(__name__)

from app.core.exceptions import UserNotFound

if TYPE_CHECKING:
    from app.services.profile.profile_service import ProfileService
from app.services.skills.user_skill import UserSkillService
from app.services.profile.accomplishment_service import AccomplishmentService
from app.services.user.research_service import ResearchService

# Schema imports for bulk operations
from app.schemas.user.experience import BulkExperienceCreate
from app.schemas.user.education import BulkEducationCreate
from app.schemas.user.project import BulkProjectCreate
from app.schemas.user.certifications import BulkCertificationCreate
from app.schemas.user.language import BulkLanguageCreate
from app.schemas.skill.user_skill import BulkUserSkillCreate
from app.schemas.user.resume import BulkResumeCreate
from app.schemas.user.research import BulkResearchCreate
from app.schemas.user.accomplishment import BulkAccomplishmentCreate



class CompleteProfileService:
    def __init__(
            self,
            db: AsyncSession,
            profile_service: ProfileService,
            experience_service: ExperienceService,
            project_service: ProjectService,
            education_service: EducationService,
            certification_service: CertificationService,
            resume_service: ResumeService,
            language_service: LanguageService,
            skill_service: UserSkillService,
            accomplishment_service: AccomplishmentService,
            research_service: ResearchService
    ):
        self.db = db
        self.profile_service = profile_service
        self.profile_repo = profile_service.profile_repo
        self.experience_service = experience_service
        self.project_service = project_service
        self.education_service = education_service
        self.certification_service = certification_service
        self.resume_service = resume_service
        self.language_service = language_service
        self.skill_service = skill_service
        self.accomplishment_service = accomplishment_service
        self.research_service = research_service

    async def get_complete_profile(self, user_id: UUID) -> Dict[str, Any]:
        """Get COMPLETE profile (admin/export ONLY) - Excludes Resumes"""
        # Parallel execution for speed
        profile_task = self.profile_service.get_profile(user_id)
        experiences_task = self.experience_service.get_all(user_id)
        projects_task = self.project_service.get_all(user_id)
        educations_task = self.education_service.get_all(user_id)
        certifications_task = self.certification_service.get_all(user_id)
        languages_task = self.language_service.get_all(user_id)
        skills_task = self.skill_service.get_user_skills(user_id)
        accomplishments_task = self.accomplishment_service.get_all(user_id)
        research_task = self.research_service.get_all(user_id)

        (
            profile, experiences, projects, educations,
            certifications, languages, skills,
            accomplishments, research
        ) = await asyncio.gather(
            profile_task, experiences_task, projects_task, educations_task,
            certifications_task, languages_task, skills_task,
            accomplishments_task, research_task,
            return_exceptions=True
        )

        # Check for any exceptions
        for result in [profile, experiences, projects, educations, certifications,
                       languages, skills, accomplishments, research]:
            if isinstance(result, Exception):
                raise result

        if not profile:
            raise UserNotFound(f"User {user_id} not found")

        # Calculate completeness
        completeness = await self.profile_service.calculate_completeness(user_id)

        return {
            "profile": profile,
            "experiences": experiences.experiences if hasattr(experiences, "experiences") else [],
            "projects": projects.projects if hasattr(projects, "projects") else [],
            "educations": educations.educations if hasattr(educations, "educations") else [],
            "certifications": certifications.certifications if hasattr(certifications, "certifications") else [],
            "languages": languages.languages if hasattr(languages, "languages") else [],
            "skills": skills.skills if hasattr(skills, "skills") else (skills if isinstance(skills, list) else []),
            "accomplishments": accomplishments.accomplishments if hasattr(accomplishments, "accomplishments") else [],
            "research": research.research if hasattr(research, "research") else [],
            "profile_completeness": completeness
        }

    async def bulk_import_profile(
            self,
            user_id: UUID,
            profile_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Bulk import from resume parser (sequential execution to avoid session conflicts)"""
        results = {}

        # Execute sequentially to avoid session conflicts
        if 'profile' in profile_data:
            try:
                result = await self.profile_repo.create_or_update_profile(user_id, profile_data['profile'])
                results['profile'] = result or "success"
            except Exception as e:
                results['profile'] = f"error: {str(e)}"

        if 'experiences' in profile_data:
            try:
                data = BulkExperienceCreate(experiences=profile_data['experiences'])
                result = await self.experience_service.replace_all(user_id, data)
                results['experiences'] = result or "success"
            except Exception as e:
                results['experiences'] = f"error: {str(e)}"

        if 'projects' in profile_data:
            try:
                data = BulkProjectCreate(projects=profile_data['projects'])
                result = await self.project_service.replace_all(user_id, data)
                results['projects'] = result or "success"
            except Exception as e:
                results['projects'] = f"error: {str(e)}"

        if 'educations' in profile_data:
            try:
                data = BulkEducationCreate(educations=profile_data['educations'])
                result = await self.education_service.replace_all(user_id, data)
                results['educations'] = result or "success"
            except Exception as e:
                results['educations'] = f"error: {str(e)}"

        if 'skills' in profile_data:
            try:
                data = BulkUserSkillCreate(skills=profile_data['skills'])
                result = await self.skill_service.replace_all(user_id, data)
                results['skills'] = result or "success"
            except Exception as e:
                results['skills'] = f"error: {str(e)}"

        if 'certifications' in profile_data:
            try:
                data = BulkCertificationCreate(certifications=profile_data['certifications'])
                result = await self.certification_service.replace_all(user_id, data)
                results['certifications'] = result or "success"
            except Exception as e:
                results['certifications'] = f"error: {str(e)}"

        if 'languages' in profile_data:
            try:
                data = BulkLanguageCreate(languages=profile_data['languages'])
                result = await self.language_service.replace_all(user_id, data)
                results['languages'] = result or "success"
            except Exception as e:
                results['languages'] = f"error: {str(e)}"

        if 'research' in profile_data:
            try:
                data = BulkResearchCreate(research=profile_data['research'])
                result = await self.research_service.replace_all(user_id, data)
                results['research'] = result or "success"
            except Exception as e:
                results['research'] = f"error: {str(e)}"

        if 'accomplishments' in profile_data:
            try:
                data = BulkAccomplishmentCreate(accomplishments=profile_data['accomplishments'])
                result = await self.accomplishment_service.replace_all(user_id, data)
                results['accomplishments'] = result or "success"
            except Exception as e:
                results['accomplishments'] = f"error: {str(e)}"

        # Final completeness score
        completeness = await self.profile_service.calculate_completeness(user_id)

        return {
            "message": "Bulk import completed",
            "imported_sections": results,
            "profile_completeness": completeness,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    async def calculate_profile_score(self, user_id: UUID) -> Dict[str, float]:
        """Calculate detailed profile completeness score by section."""
        # 1. Fetch profile
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            return {"overall": 0.0, "sections": {}}

        # 2. Fetch all collections to count them (since services don't have .count())
        experience_res = await self.experience_service.get_all(user_id)
        project_res = await self.project_service.get_all(user_id)
        education_res = await self.education_service.get_all(user_id)
        certification_res = await self.certification_service.get_all(user_id)
        skill_res = await self.skill_service.get_user_skills(user_id)
        language_res = await self.language_service.get_all(user_id)
        
        # Resumes handled specially
        try:
            resume_res = await self.resume_service.get_all(user_id)
            has_resume = resume_res.resumes is not None
        except Exception:
            has_resume = False

        sections = {
            "profile": 100.0, # Since profile exists
            "experiences": min(experience_res.total_count * 20, 100) if experience_res else 0.0,
            "projects": min(project_res.total_count * 25, 100) if project_res else 0.0,
            "education": min(education_res.total_count * 20, 100) if education_res else 0.0,
            "certifications": min(certification_res.total_count * 10, 100) if certification_res else 0.0,
            "resumes": 100.0 if has_resume else 0.0,
            "skills": min(skill_res.total_count * 10, 100) if skill_res else 0.0,
            "languages": min(language_res.total_count * 15, 100) if language_res else 0.0
        }

        overall = sum(sections.values()) / len(sections)

        return {
            "overall": round(overall, 2),
            "sections": sections
        }
