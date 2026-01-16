import logging
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

import jinja2
from weasyprint import HTML, CSS

from app.core.config import settings

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
        NOTE: AI functionality removed. This is a placeholder for future non-AI implementation.
        """
        raise NotImplementedError("Resume generation requires external AI service (not available in server)")


resume_generator = ResumeGeneratorService()
