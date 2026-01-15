from pydantic import BaseModel, ConfigDict, model_validator
from typing import Optional, List, Any
from app.constants.constants import ResumeType, ResumeFileFormat, ParsingStatus


class ParsedLocation(BaseModel):
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    address: Optional[str] = None

class ParsedUrls(BaseModel):
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    leetcode_url: Optional[str] = None
    naukri_url: Optional[str] = None
    stackoverflow_url: Optional[str] = None
    medium_url: Optional[str] = None
    personal_website: Optional[str] = None

class ParsedProfile(BaseModel):
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    alternate_phone: Optional[str] = None
    headline: Optional[str] = None
    professional_summary: Optional[str] = None
    current_role: Optional[str] = None
    current_company: Optional[str] = None
    years_of_experience: Optional[float] = None
    location: Optional[ParsedLocation] = None
    willing_to_relocate: Optional[bool] = None
    preferred_work_mode: Optional[str] = None
    availability: Optional[str] = None
    notice_period_days: Optional[int] = None
    expected_salary_min: Optional[int] = None
    expected_salary_max: Optional[int] = None
    salary_currency: Optional[str] = None
    urls: Optional[ParsedUrls] = None

class ParsedExperience(BaseModel):
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    company_website: Optional[str] = None
    company_industry: Optional[str] = None
    company_size: Optional[str] = None
    work_mode: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    start_month: Optional[int] = None
    start_year: Optional[int] = None
    end_month: Optional[int] = None
    end_year: Optional[int] = None
    is_current: bool = False
    employment_type: Optional[str] = None
    job_summary: Optional[str] = None
    key_responsibilities: List[str] = []
    achievements: List[str] = []
    skills_used: List[str] = []
    team_size: Optional[int] = None
    reporting_to: Optional[str] = None

class ParsedEducation(BaseModel):
    degree_type: Optional[str] = None
    degree_name: Optional[str] = None
    field_of_study: Optional[str] = None
    major: Optional[str] = None
    minor: Optional[str] = None
    institution_name: Optional[str] = None
    university_name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    start_month: Optional[int] = None
    start_year: Optional[int] = None
    end_month: Optional[int] = None
    end_year: Optional[int] = None
    is_current: bool = False
    grade_type: Optional[str] = None
    grade_value: Optional[str] = None
    grade_scale: Optional[str] = None
    relevant_coursework: List[str] = []
    activities: List[str] = []
    status: Optional[str] = None

class ParsedProject(BaseModel):
    project_name: Optional[str] = None
    project_type: Optional[str] = None
    status: Optional[str] = None
    short_description: Optional[str] = None
    detailed_description: Optional[str] = None
    start_month: Optional[int] = None
    start_year: Optional[int] = None
    end_month: Optional[int] = None
    end_year: Optional[int] = None
    is_ongoing: bool = False
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    key_features: List[str] = []
    technologies_used: List[str] = []

class ParsedCertification(BaseModel):
    name: Optional[str] = None
    issuing_organization: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    does_not_expire: bool = False
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None

class ParsedLanguage(BaseModel):
    language: Optional[str] = None
    proficiency: Optional[str] = None
    ability: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def convert_string(cls, data: Any) -> Any:
        if isinstance(data, str):
            return {"language": data}
        return data

class ResumeParsedData(BaseModel):
    personal_details: ParsedProfile = ParsedProfile()
    experiences: List[ParsedExperience] = []
    educations: List[ParsedEducation] = []
    projects: List[ParsedProject] = []
    certifications: List[ParsedCertification] = []
    languages: List[ParsedLanguage] = []
    technical_skills: List[str] = []

class ResumeCreate(BaseModel):
    title: str
    resume_type: int = ResumeType.MANUAL.value
    file_url: str
    file_name: str
    file_format: int = ResumeFileFormat.PDF.value
    is_default: bool = False
    
    template_name: str = "modern"
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class ResumeUpload(BaseModel):
    file_name: str
    file_format: int
    file_size_bytes: int
    file_hash: Optional[str] = None


class BulkResumeCreate(BaseModel):
    resumes: List[ResumeCreate]


from datetime import datetime
from uuid import UUID

class ResumeResponse(ResumeCreate):
    id: UUID
    created_at: Optional[datetime]
    file_size_bytes: Optional[int]
    file_hash: Optional[str]
    parsing_status: int
    parsing_completed_at: Optional[datetime]
    is_ready: bool
    has_ats_issues: bool
    times_used: int
    last_used_at: Optional[datetime]
    ats_score: Optional[int]
    parsed_data: Optional[ResumeParsedData] = None

    model_config = ConfigDict(from_attributes=True)


class BulkResumeResponse(BaseModel):
    resumes: Optional[ResumeResponse] = None
