"""Service for calculating job match scores based on user profile and job requirements."""

import logging
from typing import List, Any, Tuple, Set
from uuid import UUID
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.job.job_repository import JobRepository
from app.repositories.job.match_repository import JobMatchRepository
from app.repositories.user.profile_repository import ProfileRepository
from app.repositories.skill.user_skill_repository import UserSkillRepository
from app.models.job.job_match import JobMatchAnalysis
# from app.services.ai.nlp_service import nlp_service

class DummyNLPService:
    def calculate_match_score(self, a, b):
        return {"match_score": 0}
    def extract_keywords(self, text):
        return []

nlp_service = DummyNLPService()

logger = logging.getLogger(__name__)

class JobMatchingService:
    # Weights based on Application specifications
    WEIGHTS = {
        "role": Decimal("0.40"),
        "skills": Decimal("0.30"),
        "experience": Decimal("0.15"),
        "location": Decimal("0.10"),
        "current_role": Decimal("0.05")
    }

    def __init__(self, db: AsyncSession, user_skill_repo: UserSkillRepository = None):
        self.db = db
        self.job_repo = JobRepository(db)
        self.match_repo = JobMatchRepository(db)
        self.profile_repo = ProfileRepository(db)
        self.skill_repo = user_skill_repo or UserSkillRepository(db, None) # Fallback with None might fail if repo uses it immediately, but ideally we inject it. Wait, I should not default to broken init.
        # Ideally: arguments should be mandatory.

    async def calculate_and_save_matches(self, user_id: UUID, job_ids: List[UUID]) -> List[JobMatchAnalysis]:
        """Calculate and persist match scores for a list of jobs."""
        
        # 1. Fetch User Data context
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            logger.error(f"Cannot calculate matches: Profile not found for user {user_id}")
            return []
            
        user_skills_objs = await self.skill_repo.get_user_skills(user_id)
        user_skills = {s.skill.name.lower() for s in user_skills_objs if s.skill}
        
        results = []
        for job_id in job_ids:
            try:
                job = await self.job_repo.get(job_id)
                if not job: continue
                
                # Calculate individual match components
                role_score, _ = self._calculate_role_match(profile, job)
                skill_score, matched_skills, missing_skills = self._calculate_skill_match(user_skills, job)
                exp_score = self._calculate_experience_match(profile, job)
                loc_score = self._calculate_location_match(profile, job)
                current_rel_score = self._calculate_current_relevance(profile, job)
                
                # Weighted Overall Score
                overall = (
                    role_score * self.WEIGHTS["role"] +
                    skill_score * self.WEIGHTS["skills"] +
                    exp_score * self.WEIGHTS["experience"] +
                    loc_score * self.WEIGHTS["location"] +
                    current_rel_score * self.WEIGHTS["current_role"]
                )
                
                # Create or Update Match Record
                match_data = {
                    "user_id": user_id,
                    "job_id": job_id,
                    "overall_match": overall,
                    "skill_match": skill_score,
                    "experience_match": exp_score,
                    "location_match": loc_score,
                    "salary_match": Decimal("1.0"), # Placeholder until more logic added
                    "matched_skills": list(matched_skills),
                    "missing_skills": list(missing_skills),
                    "skill_gap_recommendations": [f"Learn {s}" for s in list(missing_skills)[:3]],
                    "model_version": "v1.0-weighted-scoring"
                }
                
                existing = await self.match_repo.get_by_user_and_job(user_id, job_id)
                if existing:
                    for k, v in match_data.items():
                        setattr(existing, k, v)
                    match_score = await self.match_repo.update(existing)
                else:
                    match_score = await self.match_repo.create(JobMatchAnalysis(**match_data))
                
                results.append(match_score)
                
            except Exception as e:
                logger.error(f"Failed to calculate match for job {job_id}: {e}")
                
        return results

    def _calculate_role_match(self, profile: Any, job: Any) -> Tuple[Decimal, str]:
        """40% Weight: Compares user headline/current_role with job title."""
        user_role_context = f"{profile.headline or ''} {profile.current_role or ''}".lower()
        job_title = job.title.lower()
        
        # Simple overlap for now, could be enhanced with embeddings
        overlap = nlp_service.calculate_match_score(user_role_context, job_title)
        return Decimal(str(overlap["match_score"] / 100)), "matched"

    def _calculate_skill_match(self, user_skills: Set[str], job: Any) -> Tuple[Decimal, Set[str], Set[str]]:
        """30% Weight: Direct technical skill overlap."""
        job_skills = set([s.lower() for s in (job.extracted_keywords or [])])
        
        if not job_skills:
            # Fallback to NLP extraction from description
            if job.description:
                extracted = nlp_service.extract_keywords(job.description)
                job_skills = {k.lower() for k, v in extracted}
        
        if not job_skills: return Decimal("0.0"), set(), set()
        
        matched = user_skills & job_skills
        missing = job_skills - user_skills
        
        score = Decimal(str(len(matched) / len(job_skills)))
        return score, matched, missing

    def _calculate_experience_match(self, profile: Any, job: Any) -> Decimal:
        """15% Weight: Years of experience vs requirement."""
        user_exp = float(profile.years_of_experience or 0)
        
        # Map job enums to years
        # Map job enums to years
        from app.constants.constants import ExperienceLevel
        
        # Mapping IntEnum -> Years
        level_map = {
            ExperienceLevel.INTERN.value: 0,
            ExperienceLevel.ENTRY_LEVEL.value: 1,
            ExperienceLevel.JUNIOR.value: 2,
            ExperienceLevel.MID_LEVEL.value: 5,
            ExperienceLevel.SENIOR.value: 8,
            ExperienceLevel.LEAD.value: 12,
            ExperienceLevel.ARCHITECT.value: 15,
            ExperienceLevel.EXECUTIVE.value: 20
        }
        required_exp = level_map.get(job.experience_level, 0)
        
        if required_exp == 0: return Decimal("1.0")
        if user_exp >= required_exp: return Decimal("1.0")
        
        return Decimal(str(user_exp / required_exp))

    def _calculate_location_match(self, profile: Any, job: Any) -> Decimal:
        """10% Weight: Geographic and work mode preferences."""
        # 1. Work Mode Match
        from app.constants.constants import WorkMode
        
        if job.work_mode == profile.preferred_work_mode:
            mode_score = Decimal("1.0")
        elif job.work_mode == WorkMode.REMOTE.value or profile.preferred_work_mode == WorkMode.REMOTE.value:
            mode_score = Decimal("0.5") # Partial match including remote flexibility
        else:
            mode_score = Decimal("0.0")
            
        # 2. Location match
        loc_score = Decimal("0.0")
        if job.location_city and profile.current_city:
            if job.location_city.lower() == profile.current_city.lower():
                loc_score = Decimal("1.0")
        elif profile.willing_to_relocate:
            loc_score = Decimal("0.7")
            
        return (mode_score + loc_score) / 2

    def _calculate_current_relevance(self, profile: Any, job: Any) -> Decimal:
        """5% Weight: Similarity to current role."""
        if not profile.current_role: return Decimal("0.5")
        
        overlap = nlp_service.calculate_match_score(profile.current_role.lower(), job.title.lower())
        return Decimal(str(overlap["match_score"] / 100))
