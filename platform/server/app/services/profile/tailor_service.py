"""Service for tailoring resumes for specific job postings."""

import logging
from uuid import UUID
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
# from app.services.ai.resume_generation_service import resume_generation_service
from app.services.profile.pdf_service import pdf_resume_service
from app.services.storage.resume_storage import storage_service
from app.repositories.user.resume_repository import ResumeRepository
from app.repositories.user.profile_repository import ProfileRepository
from app.models.user.resume import UserResume
from app.constants.constants import ParsingStatus, ResumeType, ResumeFileFormat

logger = logging.getLogger(__name__)

class ResumeTailorService:
    """Service to create tailored resumes for specific jobs."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.resume_repo = ResumeRepository(db)
        self.profile_repo = ProfileRepository(db)

    async def tailor_resume(
        self, 
        user_id: UUID, 
        base_resume_id: UUID, 
        job_description: str,
        job_id: Optional[UUID] = None,
        optimized_content: Optional[dict] = None
    ) -> UserResume:
        """
        Create a tailored version of a base resume for a specific job.
        If optimized_content is provided (from Agent), it uses that.
        Otherwise, it performs optimization internally (stubbed).
        """
        try:
            # 1. Fetch Base Resume
            base_resume = await self.resume_repo.get(base_resume_id)
            if not base_resume or base_resume.user_id != user_id:
                raise ValueError("Base resume not found or access denied")
            
            # Fetch Detailed Profile Context (for PDF generation)
            profile = await self.profile_repo.get_by_user_id(user_id)
            
            # 2. Content Identification
            logger.info(f"Tailoring resume {base_resume_id} for user {user_id}")
            
            if optimized_content:
                logger.info("Using pre-optimized content provided by Agent.")
                optimization_result = {"method": "agent_local"}
            else:
                # Fallback to base or internal optimization (stubbed)
                logger.warning("AI Resume Optimization is temporarily disabled on Server. No optimized_content provided.")
                optimization_result = {"method": "fallback_base"}
                optimized_content = base_resume.parsed_data or {"content": "Base resume content"}

            
            # 3. Generate PDF
            # Merge profile basic info with optimized content
            pdf_data = {
                "full_name": profile.full_name if profile else "Professional",
                "email": profile.email if profile else None,
                "phone": profile.phone_number if profile else None,
                "location": f"{profile.current_city}, {profile.current_country}" if profile and profile.current_city else "Remote",
                "linkedin_url": profile.linkedin_url if profile else None,
                "github_url": profile.github_url if profile else None,
                "summary": optimized_content.get("summary"),
                "skills": optimized_content.get("skills"),
                "experience": optimized_content.get("experience"),
                "education": optimized_content.get("education"),
                "projects": optimized_content.get("projects", [])
            }
            
            pdf_bytes = pdf_resume_service.generate_resume_pdf(pdf_data)
            
            # 4. Upload to R2
            import hashlib
            import time
            unique_id = hashlib.md5(f"{user_id}{time.time()}".encode()).hexdigest()[:8]
            file_key = f"resumes/{user_id}/tailored_{unique_id}.pdf"
            
            storage_service.upload_file_bytes(pdf_bytes, file_key, "application/pdf")
            
            # 5. Create Tailored Resume Record
            tailored_data = {
                "user_id": user_id,
                "title": f"Tailored: {base_resume.title} ({unique_id})",
                "resume_type": ResumeType.TAILORED.value,
                "base_resume_id": base_resume_id,
                "tailored_for_job_id": job_id,
                "parsing_status": ParsingStatus.SUCCESS.value,
                "parsed_data": optimized_content,
                "optimization_metadata": optimization_result.get("optimization_metadata"),
                "file_url": file_key,
                "file_name": f"tailored_{unique_id}.pdf",
                "file_format": ResumeFileFormat.PDF.value,
                "is_default": False
            }
            
            tailored_resume = UserResume(**tailored_data)
            created_resume = await self.resume_repo.create(tailored_resume)
            
            logger.info(f"Successfully created tailored resume and PDF: {created_resume.id}")
            return created_resume
            
        except Exception as e:
            logger.error(f"Failed to tailor resume: {e}")
            raise

# No global instance here as it needs DB session
