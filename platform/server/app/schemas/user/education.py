from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from app.constants.constants import EducationLevel, GradeType, EducationStatus


class EducationCreate(BaseModel):
    degree_type: int
    degree_name: str
    field_of_study: str
    institution_name: str
    university_name: Optional[str] = None
    
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "India"

    start_month: int
    start_year: int
    end_month: Optional[int] = None
    end_year: Optional[int] = None
    no_of_years: Optional[int] = None
    
    grade_type: Optional[int] = None
    grade_value: Optional[str] = None
    grade_scale: Optional[str] = None
    
    relevant_coursework: Optional[List[str]] = None
    description: Optional[str] = None
    
    thesis_title: Optional[str] = None
    thesis_description: Optional[str] = None
    research_areas: Optional[List[str]] = None
    publications: Optional[List[str]] = None
    

    
    status: int = EducationStatus.COMPLETED.value
    
    display_order: Optional[int] = 0


class BulkEducationCreate(BaseModel):
    educations: List[EducationCreate]


class EducationResponse(EducationCreate):
    id: UUID
    is_ongoing: bool
    start_date: str
    end_date: Optional[str]
    grade_display: Optional[str]

    model_config = {"from_attributes": True}


class BulkEducationResponse(BaseModel):
    educations: List[EducationResponse]
    total_count: int
