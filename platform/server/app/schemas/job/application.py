"""Job application schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.constants.constants import ApplicationStatus


# ============================================
# JOB SCHEMAS (Nested in Application)
# ============================================

class JobBase(BaseModel):
    """Base job schema."""
    title: str
    company_name: str
    company_logo_url: Optional[str] = None
    location_city: Optional[str] = None
    location_state: Optional[str] = None
    location_country: Optional[str] = "India"
    location_type: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: Optional[str] = "INR"
    job_type: Optional[int] = None


class JobInApplication(JobBase):
    """Job schema for nested display in application."""
    id: UUID
    company_website: Optional[str] = None
    apply_url: str
    
    class Config:
        from_attributes = True


# ============================================
# APPLICATION SCHEMAS
# ============================================

class ApplicationBase(BaseModel):
    """Base application schema."""
    job_id: UUID
    status: int = ApplicationStatus.NOT_APPLIED.value
    notes: Optional[str] = Field(None, max_length=2000)
    application_source: Optional[int] = None


class ApplicationCreate(ApplicationBase):
    """Schema for creating an application."""
    resume_used_id: Optional[UUID] = None
    cover_letter_used_id: Optional[UUID] = None


class ApplicationUpdate(BaseModel):
    """Schema for updating an application."""
    status: Optional[int] = None
    notes: Optional[str] = Field(None, max_length=2000)
    applied_at: Optional[datetime] = None
    response_received_at: Optional[datetime] = None
    interview_scheduled_at: Optional[datetime] = None
    offer_received_at: Optional[datetime] = None
    next_followup_at: Optional[datetime] = None


class ApplicationStatusUpdate(BaseModel):
    """Schema for updating application status."""
    status: int


class ApplicationResponse(ApplicationBase):
    """Schema for application response."""
    id: UUID
    user_id: UUID
    applied_at: Optional[datetime] = None
    response_received_at: Optional[datetime] = None
    interview_scheduled_at: Optional[datetime] = None
    offer_received_at: Optional[datetime] = None
    resume_used_id: Optional[UUID] = None
    cover_letter_used_id: Optional[UUID] = None
    next_followup_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Nested job data
    job: JobInApplication
    
    class Config:
        from_attributes = True


class ApplicationStats(BaseModel):
    """Application statistics schema."""
    total: int
    pending: int
    applied: int
    interview: int
    offer: int
    rejected: int
    withdrawn: int
    response_rate: float
