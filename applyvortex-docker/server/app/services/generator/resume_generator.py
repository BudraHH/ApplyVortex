import logging
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

import jinja2
from weasyprint import HTML, CSS

from app.core.prompts.resume_prompt import build_resume_prompt
# from app.services.ai.resume_scoring_service import ResumeScoringService
from app.core.config import settings

# resume_ai_service = ResumeScoringService(api_key=settings.AI_API_KEY_RESUME_GENERATION or settings.AI_API_KEY_RESUME or settings.AI_API_KEY)

class DummyResumeScoringService:
    def __init__(self, api_key=None): pass
    async def generate_json(self, prompt): return {}

resume_ai_service = DummyResumeScoringService()
from app.schemas.generator import GeneratedResume
from app.models.user.user import User

# Setup Jinja2 Environment
template_loader = jinja2.FileSystemLoader(searchpath="/app/app/templates/resume")
template_env = jinja2.Environment(loader=template_loader)

logger = logging.getLogger(__name__)

class ResumeGeneratorService:
    
    async def generate_tailored_resume_pdf(self, db: AsyncSession, user_id: UUID, job_description: str) -> bytes:
        """
        Generates a tailored resume PDF for the given user and job description.
        """
        # 1. Fetch Master Data
        logger.info(f"Fetching master data for user {user_id}")
        stmt = select(User).where(User.id == user_id).options(
            selectinload(User.experiences),
            selectinload(User.educations),
            selectinload(User.projects),
            selectinload(User.skills), # Assuming skills are linked directly or via map
            # Add other relations as needed
        )
        result = await db.execute(stmt)
        user = result.scalars().first()
        
        if not user:
            raise ValueError(f"User {user_id} not found")

        # 2. Serialize Master Profile to JSON
        # Naive serialization - in prod use Pydantic models with from_orm
        master_profile = {
            "name": f"{user.first_name} {user.last_name}",
            "email": user.email,
            "experiences": [
                {
                    "title": exp.job_title,
                    "company": exp.company_name,
                    "bullets": exp.achievements or exp.key_responsibilities or [],
                    "start": f"{exp.start_month}/{exp.start_year}",
                    "end": f"{exp.end_month}/{exp.end_year}" if not exp.is_current else "Present"
                } for exp in user.experiences
            ],
            "projects": [
                {
                    "name": p.project_name,
                    "description": p.detailed_description or p.short_description or "",
                    "tech": [s.name for s in p.project_skills] if p.project_skills else []
                } for p in user.projects
            ],
            "education": [
                {
                    "institution": edu.institution_name,
                    "degree": edu.degree_name,
                    "year": str(edu.end_year) if edu.end_year else "Present"
                } for edu in user.educations
            ],
            # Helper: extract skills from experience for now if direct skills missing
            # or use user.skills if available
        }
        
        # 3. Build Prompt
        prompt = build_resume_prompt(
            master_profile_json=str(master_profile), # rough stringify
            job_description=job_description
        )
        
        # 4. Call LLM
        logger.info("Calling LLM for resume tailoring...")
        llm_response_json = await resume_ai_service.generate_json(prompt)
        
        # 5. Validate JSON Schema
        logger.info("Validating LLM response...")
        resume_data = GeneratedResume.model_validate(llm_response_json)
        
        # 6. Render HTML
        logger.info("Rendering HTML...")
        template = template_env.get_template("modern.html")
        html_content = template.render(resume=resume_data)
        
        # 7. Generate PDF
        logger.info("Generating PDF...")
        # Use simple CSS for paging
        pdf_bytes = HTML(string=html_content).write_pdf()
        
        logger.info(f"Resume generated successfully ({len(pdf_bytes)} bytes)")
        return pdf_bytes

resume_generator = ResumeGeneratorService()
