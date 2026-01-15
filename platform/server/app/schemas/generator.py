from typing import List, Optional
from pydantic import BaseModel

class PersonalInfo(BaseModel):
    name: str
    contact: str  # Can be "Phone | Email | Location | LinkedIn" combined string or structured

class Skills(BaseModel):
    languages: List[str]
    frameworks: List[str]
    tools: List[str]

class WorkExperience(BaseModel):
    company: str
    role: str
    dates: str
    bullets: List[str]

class Project(BaseModel):
    name: str
    tech_stack: str
    description: str

class Education(BaseModel):
    institution: str
    degree: str
    dates: str
    details: Optional[str] = None

class GeneratedResume(BaseModel):
    personal_info: PersonalInfo
    summary: str
    skills: Skills
    work_experience: List[WorkExperience]
    projects: List[Project]
    education: List[Education]
