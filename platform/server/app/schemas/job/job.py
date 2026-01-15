from datetime import datetime
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field
from typing import Optional, List
from app.constants.constants import ExperienceLevel, WorkMode, ApplicationStatus, Portal


class JobCreate(BaseModel):
    portal: Optional[int] = Portal.LINKEDIN.value
    external_id: Optional[str] = None
    
    # Core
    title: str
    company_name: str
    company_website: Optional[str] = None
    
    # Logic
    application_method: int = 2
    job_post_url: str
    external_apply_url: Optional[str] = None
    status: str = "pending"
    job_metadata: Optional[dict] = {}
    
    # Location
    location_raw: Optional[str] = None
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    work_mode: Optional[int] = None
    
    # Compensation
    salary_raw: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: Optional[str] = "INR"
    
    # Details
    description: Optional[str] = None
    job_type: Optional[int] = None
    experience_level: Optional[int] = None
    
    # AI Data
    requirements: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    extracted_keywords: Optional[List[str]] = None
    
    # Meta
    posted_at: Optional[datetime] = None
    scraped_at: Optional[datetime] = None
    
    # Deep Scraping Fields
    is_easy_apply: bool = False
    applicants: Optional[str] = None
    seniority_level: Optional[str] = None
    deep_scraped_at: Optional[datetime] = None
    
    is_featured: bool = False
    is_active: bool = True


class BulkJobCreate(BaseModel):
    jobs: List[JobCreate]


class JobEnrichedCreate(JobCreate):
    """Schema for jobs that have been processed/enriched by AI"""
    match_score: Decimal
    matched_skills: Optional[List[str]] = []
    missing_skills: Optional[List[str]] = []
    skill_gap_recommendations: Optional[List[str]] = []
    
    # Granular scores if available (optional)
    skill_match: Optional[Decimal] = None
    experience_match: Optional[Decimal] = None
    location_match: Optional[Decimal] = None
    salary_match: Optional[Decimal] = None
    
    reasoning: Optional[str] = None
    seniority_fit: Optional[int] = None


class BulkEnrichedJobCreate(BaseModel):
    jobs: List[JobEnrichedCreate]


class JobMatchAnalysisRead(BaseModel):
    overall_match: Decimal
    skill_match: Decimal
    experience_match: Decimal
    location_match: Decimal
    matched_skills: Optional[List[str]] = []
    missing_skills: Optional[List[str]] = []
    skill_gap_recommendations: Optional[List[str]] = []
    match_quality: Optional[int] = None
    analysis_notes: Optional[str] = None # Added for AI reasoning
    
    class Config:
        from_attributes = True


class JobResponse(JobCreate):
    id: UUID
    user_id: Optional[UUID] = None
    application_status: int = ApplicationStatus.NOT_APPLIED.value
    applied_at: Optional[datetime] = None
    match_score: Optional[JobMatchAnalysisRead] = None

    class Config:
        from_attributes = True

    @classmethod
    def model_validate(cls, obj, **kwargs):
        # Handle the translation from Job model + associations to flat JobResponse
        if hasattr(obj, "user_job_maps") and obj.user_job_maps:
            # We assume the first association is the relevant one (filtered by query)
            assoc = obj.user_job_maps[0]
            data = {
                "application_status": assoc.application_status,
                "applied_at": assoc.applied_at,
                "user_id": assoc.user_id,
            }
            validated = super().model_validate(obj, **kwargs)
            for k, v in data.items():
                setattr(validated, k, v)
            
            # Populate match_score if present in match_scores list for this user
            if hasattr(obj, "match_scores") and obj.match_scores and hasattr(assoc, "user_id"):
                # Find the match score for this user
                for match in obj.match_scores:
                    if match.user_id == assoc.user_id:
                         # Use proper validation to avoid silent serialization errors
                         try:
                             match_read = JobMatchAnalysisRead.model_validate(match)
                             setattr(validated, "match_score", match_read)
                         except Exception:
                             # Should we log? For now, ignore invalid match scores to prevent 500
                             pass
                         break
            
            return validated
        return super().model_validate(obj, **kwargs)



class JobListItem(BaseModel):
    id: UUID
    title: str
    company_name: str
    portal: Optional[int]
    location: Optional[str] = Field(None, validation_alias="location_raw") # Map raw location
    job_type: Optional[str] = None # Converted to str for display logic if needed or int
    posted_at: Optional[datetime] = None
    application_status: int = ApplicationStatus.NOT_APPLIED.value # Application status for this user
    match_score: Optional[Decimal] = None # NEW: Expose score for list view
    
    class Config:
        from_attributes = True

    @classmethod
    def model_validate(cls, obj, **kwargs):
        # Handle the translation from Job model + associations to flat JobListItem
        validated = super().model_validate(obj, **kwargs)
        
        # 1. Populate Application Status
        if hasattr(obj, "user_job_maps") and obj.user_job_maps:
            # We assume the first association is the relevant one (filtered by query)
            assoc = obj.user_job_maps[0]
            validated.application_status = assoc.application_status
            
            # 2. Populate Match Score
            # Only if we have a valid user association to link against
            if hasattr(obj, "match_scores") and obj.match_scores:
                for match in obj.match_scores:
                    if match.user_id == assoc.user_id:
                        validated.match_score = match.overall_match
                        break
                        
        return validated


class BulkJobResponse(BaseModel):
    jobs: List[JobListItem]
    total_count: int


class JobDetailAnalysis(JobResponse):
    overall_score: Optional[Decimal] = Field(None, validation_alias="overall_match", serialization_alias="overall_match")
    match_quality: Optional[int] = None
    
    matched_skills: Optional[List[str]] = []
    missing_skills: Optional[List[str]] = []
    skill_gap_recommendations: Optional[List[str]] = []
    
    # Deep Scraping Fields (exposed in detail view)
    is_easy_apply: bool = False
    applicants: Optional[str] = None
    seniority_level: Optional[str] = None
    deep_scraped_at: Optional[datetime] = None

    @classmethod
    def model_validate(cls, obj, **kwargs):
        # 1. Base validation (handles Job fields + UserJobMap map via JobResponse logic)
        validated = super().model_validate(obj, **kwargs)
        
        # 2. Populate granular match details from JobMatchAnalysis
        # We need to find the specific match record for this user, similar to how JobResponse does it,
        # but flattening the fields onto this model instead of nesting them.
        if hasattr(obj, "match_scores") and obj.match_scores and hasattr(obj, "user_job_maps") and obj.user_job_maps:
             assoc = obj.user_job_maps[0]
             for match in obj.match_scores:
                 if match.user_id == assoc.user_id:
                     # Map fields from the match object to this schema
                     validated.overall_score = match.overall_match
                     validated.match_quality = match.match_quality
                     validated.matched_skills = match.matched_skills
                     validated.missing_skills = match.missing_skills
                     validated.skill_gap_recommendations = match.skill_gap_recommendations
                     
                     # Also ensure the nested match_score is set (inherited from JobResponse)
                     # This provides backward compatibility if frontend checks nested object
                     try:
                         validated.match_score = JobMatchAnalysisRead.model_validate(match)
                     except:
                         pass
                     break
        
        return validated