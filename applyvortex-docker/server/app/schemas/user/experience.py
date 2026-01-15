from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID


from app.constants.constants import JobType, WorkMode, CompanySize


class ExperienceSkill(BaseModel):
    id: Optional[UUID] = None
    name: str

    model_config = {"from_attributes": True}


class ExperienceCreate(BaseModel):
    job_title: str
    company_name: str
    
    work_mode: int = WorkMode.ONSITE.value
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "India"
    
    start_month: int
    start_year: int
    end_month: Optional[int] = None
    end_year: Optional[int] = None
    is_current: bool = False
    
    employment_type: int
    
    job_summary: Optional[str] = None
    achievements: Optional[List[str]] = None
    
    skills: Optional[List[ExperienceSkill]] = None
    display_order: Optional[int] = 0


class BulkExperienceCreate(BaseModel):
    experiences: List[ExperienceCreate]


class ExperienceResponse(ExperienceCreate):
    id: UUID
    is_ongoing: bool
    start_date: str
    end_date: Optional[str]
    skills: List[ExperienceSkill] = Field(default_factory=list, validation_alias="skills_payload")

    model_config = {"from_attributes": True}


class BulkExperienceResponse(BaseModel):
    experiences: List[ExperienceResponse]
    total_count: int
