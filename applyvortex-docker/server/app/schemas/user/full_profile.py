from typing import List, Optional
from pydantic import BaseModel
from app.schemas.user.profile import ProfileResponse
from app.schemas.user.education import EducationResponse
from app.schemas.user.experience import ExperienceResponse
from app.schemas.user.project import ProjectResponse
from app.schemas.user.certifications import CertificationResponse
from app.schemas.user.accomplishment import AccomplishmentResponse
from app.schemas.user.research import ResearchResponse
from app.schemas.user.language import LanguageResponse
from app.schemas.skill.user_skill import UserSkillResponse

class FullProfileResponse(BaseModel):
    """Aggregated User Data for Agent Automation"""
    profile: ProfileResponse
    education: List[EducationResponse]
    experience: List[ExperienceResponse]
    projects: List[ProjectResponse]
    certifications: List[CertificationResponse]
    accomplishments: List[AccomplishmentResponse]
    research: List[ResearchResponse]
    languages: List[LanguageResponse]
    skills: List[UserSkillResponse]
