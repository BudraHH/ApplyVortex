
from agent.services.ai.base import LocalAIBaseService
import json

class ResumeGenerationService(LocalAIBaseService):
    """Service for tailoring resumes locally."""

    def __init__(self):
        super().__init__(
            system_prompt="You are a professional Resume Writer."
        )

    async def optimize_resume(self, resume_json: dict, job_description: str) -> dict:
        """Tailor resume content."""
        prompt = f"""
        Optimize the following resume for the provided job description.
        Refine the summary and experience bullet points to highlight relevant keywords.
        Do NOT invent facts. Only rephrase existing experience.
        
        JOB DESCRIPTION:
        {job_description[:3000]}
        
        RESUME JSON:
        {json.dumps(resume_json)}
        
        Output the full valid JSON of the optimized resume.
        """
        
        return await self.generate_json(prompt)

resume_generation_service = ResumeGenerationService()
