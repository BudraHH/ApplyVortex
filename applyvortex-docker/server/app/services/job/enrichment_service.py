"""Service for enriching raw scraped job data using AI."""

import logging
from typing import Dict, Any
# from app.services.ai.resume_scoring_service import ResumeScoringService
from app.core.config import settings
from app.constants.constants import ExperienceLevel, JobType, WorkMode

logger = logging.getLogger(__name__)

class JobEnrichmentService:
    ENRICHMENT_PROMPT = """
    Analyze the following job description and extract structured information for a developer/IT role.
    
    Job Description:
    {description}
    
    Return a JSON object with the following fields:
    - "technical_skills": List of specific technologies, languages, and frameworks mentioned.
    - "experience_level": Strictly one of these values: "entry-level", "junior", "mid-level", "senior", "lead", "architect".
    - "min_years_experience": The minimum years of experience required as an integer.
    - "job_type": Strictly one of these values: "full-time", "part-time", "contract", "internship", "freelance".
    - "location_type": Strictly one of these values: "onsite", "remote", "hybrid".
    - "suggested_title": A clean, standardized version of the job title.
    - "is_remote_friendly": Boolean.
    
    Constraints:
    - If a field is not findable, use null.
    - Keep skills concise (e.g., "Python", not "Experience with Python").
    """

    async def enrich_job(self, description: str) -> Dict[str, Any]:
        """Use AI to extract structured metadata from job description."""
        if not description or len(description) < 50:
            return {}
            
        prompt = self.ENRICHMENT_PROMPT.format(description=description[:6000])
        try:
            # Initialize a specialized service instance for enrichment
            # ai_service = ResumeScoringService(api_key=settings.AI_API_KEY)
            # result = await ai_service.generate_json(prompt)
            result = {} # Dummy result
            return {} # Early return to avoid processing empty result if logic below expects data
            
            # Basic validation and mapping to Integers
            
            # Basic validation and mapping to Integers
            
            # Experience Mapping
            exp_str = result.get("experience_level", "").lower().replace("-", "_") if result.get("experience_level") else ""
            try:
                 # Try to match string to Enum name
                 # e.g. "entry_level" -> ExperienceLevel.ENTRY_LEVEL
                 # Manual map might be safer
                 
                 exp_map = {
                     "intern": ExperienceLevel.INTERN.value,
                     "entry_level": ExperienceLevel.ENTRY_LEVEL.value,
                     "junior": ExperienceLevel.JUNIOR.value,
                     "mid_level": ExperienceLevel.MID_LEVEL.value,
                     "senior": ExperienceLevel.SENIOR.value,
                     "lead": ExperienceLevel.LEAD.value,
                     "architect": ExperienceLevel.ARCHITECT.value,
                     "executive": ExperienceLevel.EXECUTIVE.value
                 }
                 result["experience_level"] = exp_map.get(exp_str, ExperienceLevel.MID_LEVEL.value) # Default MID
            except:
                 result["experience_level"] = ExperienceLevel.MID_LEVEL.value
            
            # Job Type Mapping
            type_str = result.get("job_type", "").lower().replace("-", "_")
            type_map = {
                "full_time": JobType.FULL_TIME.value,
                "part_time": JobType.PART_TIME.value,
                "contract": JobType.CONTRACT.value,
                "internship": JobType.INTERNSHIP.value,
                "freelance": JobType.FREELANCE.value
            }
            result["job_type"] = type_map.get(type_str, JobType.FULL_TIME.value)

            # Location Type Mapping
            loc_str = result.get("location_type", "").lower()
            loc_map = {
                "onsite": WorkMode.ONSITE.value,
                "remote": WorkMode.REMOTE.value,
                "hybrid": WorkMode.HYBRID.value
            }
            result["location_type"] = loc_map.get(loc_str, WorkMode.ONSITE.value)
                
            return result
        except Exception as e:
            logger.error(f"Job Enrichment failed: {e}")
            return {}

# Global instance
job_enrichment_service = JobEnrichmentService()
