
from agent.services.ai.base import LocalAIBaseService
import json
import logging

logger = logging.getLogger(__name__)

class ResumeScoringService(LocalAIBaseService):
    """Service for scoring jobs locally."""

    def __init__(self):
        super().__init__(
            system_prompt="You are an expert Technical Recruiter. You always output valid JSON."
        )

    async def score_job(self, job_data: dict, profile_context: str) -> dict:
        """
        Score a single job against the profile.
        """
        job_title = job_data.get("title", "")
        job_desc = job_data.get("description", "")
        
        prompt = f"""
        JOB TITLE: {job_title}
        JOB DESCRIPTION:
        {job_desc[:4000]}
        
        CANDIDATE PROFILE:
        {profile_context}
        
        INSTRUCTIONS:
        1. Evaluate the candidate's fit for this job (0-100).
        2. Provide short reasoning.
        3. Identify missing critical skills.
        
        OUTPUT JSON FORMAT:
        {{
            "match_score": 85,
            "reasoning": "Good match but missing AWS experience.",
            "missing_skills": ["AWS", "Kubernetes"],
            "decision": "shortlist" 
        }}
        (decision values: shortlist, reserve, reject)
        """
        
        try:
            result = await self.generate_json(prompt)
            
            # Normalize keys if model hallucinates slightly different casing
            score = result.get("match_score", 0)
            if score < 1 and score > 0: score = int(score * 100) # handle 0.85
            
            return {
                "match_score": float(score) / 100.0,
                "ai_reasoning": result.get("reasoning", "No reasoning"),
                "missing_skills": result.get("missing_skills", []),
                "ai_decision": result.get("decision", "reserve")
            }
        except Exception as e:
            logger.error(f"Scoring failed: {e}")
            return {
                "match_score": 0,
                "ai_reasoning": "Local AI Failed",
                "ai_decision": "error"
            }

resume_scoring_service = ResumeScoringService()
