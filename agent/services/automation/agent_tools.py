"""Tools for ApplyVortex AI Agent to interact with the platform."""

import logging
from typing import Dict, Any, List, Optional
from uuid import UUID
from langchain.tools import tool
from app.services.job.job import JobService
from app.services.profile.tailor_service import ResumeTailorService
from app.services.automation.browser_service import browser_service
from app.services.job.application import ApplicationService
from app.core.dependencies import get_db

logger = logging.getLogger(__name__)

class AgentTools:
    def __init__(self, db_session):
        self.db = db_session
        self.job_service = JobService(db=db_session)
        self.tailor_service = ResumeTailorService(db=db_session)
        self.app_service = ApplicationService(db=db_session)

    @tool
    async def research_job(self, job_id: str) -> str:
        """Fetch full job details and requirements for a given Job ID."""
        try:
            job = await self.job_service.job_repo.get(UUID(job_id))
            if not job: return "Job not found."
            return f"Title: {job.title}\nCompany: {job.company_name}\nDescription: {job.description}\nRequirements: {job.requirements}"
        except Exception as e:
            return f"Error researching job: {e}"

    @tool
    async def tailor_resume_for_job(self, user_id: str, job_id: str, base_resume_id: str) -> str:
        """Create a tailored resume for a specific job and return the new resume ID."""
        try:
            job = await self.job_service.job_repo.get(UUID(job_id))
            if not job: return "Job not found."
            
            tailored = await self.tailor_service.tailor_resume(
                user_id=UUID(user_id),
                base_resume_id=UUID(base_resume_id),
                job_description=job.description,
                job_id=job.id
            )
            return f"Tailored resume created successfully. New Resume ID: {tailored.id}"
        except Exception as e:
            return f"Error tailoring resume: {e}"

    @tool
    async def get_user_profile_summary(self, user_id: str) -> str:
        """Get a summary of the user's profile for context."""
        try:
            # Simple summary for agent context
            from app.repositories.user.profile_repository import ProfileRepository
            repo = ProfileRepository(self.db)
            profile = await repo.get_by_user_id(UUID(user_id))
            if not profile: return "Profile not found."
            return f"Name: {profile.full_name}\nEmail: {profile.email}\nExperience: {profile.years_of_experience} years\nHeadline: {profile.headline}"
        except Exception as e:
            return f"Error getting profile: {e}"

    @tool
    async def submit_application(self, user_id: str, job_id: str, resume_id: str) -> str:
        """Attempt to auto-fill and submit the application on the external site."""
        try:
            # 1. Fetch Data
            job = await self.job_service.job_repo.get(UUID(job_id))
            if not job or not job.apply_url: return "Job or Apply URL not found."
            
            from app.repositories.user.profile_repository import ProfileRepository
            from app.repositories.user.resume_repository import ResumeRepository
            profile = await ProfileRepository(self.db).get_by_user_id(UUID(user_id))
            resume = await ResumeRepository(self.db).get(UUID(resume_id))
            
            if not profile or not resume: return "Profile or Resume not found."

            # 2. Browser Action
            try:
                context, page = await browser_service.create_session()
                await browser_service.navigate_to_job(page, job.apply_url)
                
                # 3. Detect and Fill Fields (Simplified Logic)
                from app.services.automation.browser_service import FormFieldMapper
                fields = await FormFieldMapper.get_form_context(page)
                
                filled_count = 0
                for field in fields:
                    label = field['label'].lower()
                    name = field['name'].lower()
                    placeholder = field['placeholder'].lower()
                    identifier = f"{label} {name} {placeholder}"
                    
                    val = None
                    if any(x in identifier for x in ['first', 'given']): val = profile.first_name
                    elif any(x in identifier for x in ['last', 'family']): val = profile.last_name
                    elif any(x in identifier for x in ['email']): val = profile.email
                    elif any(x in identifier for x in ['phone', 'mobile']): val = profile.phone_number
                    elif any(x in identifier for x in ['linkedin']): val = profile.linkedin_url
                    elif any(x in identifier for x in ['portfolio']): val = profile.portfolio_url
                    
                    if val and await field['element'].is_visible():
                        # Use human-like typing
                        await browser_service.type_slowly(page, f"input[name='{field['name']}']", str(val))
                        filled_count += 1
                
                # TODO: Handle file upload (resume) - requires complex file path handling
                # TODO: Handle Click Submit - risky to auto-submit in Phase 2, maybe just fill?
                
                await context.close()
                return f"Successfully navigated and filled {filled_count} fields. Please review and submit manually."
                
            except Exception as be:
                logger.error(f"Browser automation failed: {be}")
                return f"Browser automation failed: {be}"

        except Exception as e:
            return f"Error submitting application: {e}"
