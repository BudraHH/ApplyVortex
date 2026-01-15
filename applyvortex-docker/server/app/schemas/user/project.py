from pydantic import BaseModel, Field
from typing import Optional, List

from app.constants.constants import ProjectType, ProjectStatus
from uuid import UUID  # Import


class ProjectSkill(BaseModel):
    id: Optional[UUID] = None
    name: str
    model_config = {"from_attributes": True}


class ProjectCreate(BaseModel):
    project_name: str
    project_type: int = ProjectType.PERSONAL.value
    status: int = ProjectStatus.COMPLETED.value
    
    short_description: Optional[str] = None
    detailed_description: Optional[str] = None
    
    start_month: Optional[int] = None
    start_year: Optional[int] = None
    end_month: Optional[int] = None
    end_year: Optional[int] = None
    
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    documentation_url: Optional[str] = None
    
    
    skills: Optional[List[ProjectSkill]] = None
    


class BulkProjectCreate(BaseModel):
    projects: List[ProjectCreate]


class ProjectResponse(ProjectCreate):
    id: UUID
    start_date: Optional[str]
    end_date: Optional[str]
    is_active: bool
    skills: List[ProjectSkill] = Field(default_factory=list, validation_alias="skills_payload")
    
    model_config = {"from_attributes": True}


class BulkProjectResponse(BaseModel):
    projects: List[ProjectResponse]
    total_count: int
