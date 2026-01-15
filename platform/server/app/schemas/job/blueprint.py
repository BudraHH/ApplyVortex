from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.constants.constants import (
    JobAlertDelivery, ExperienceLevel
)

class BlueprintBase(BaseModel):
    name: Optional[str] = None
    keywords: Optional[List[str]] = None
    excluded_keywords: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    portal_slug: Optional[str] = None
    companies: Optional[List[str]] = None
    min_salary: Optional[int] = None
    companies: Optional[List[str]] = None
    min_salary: Optional[int] = None

    experience_level: Optional[int] = None
    job_type: Optional[int] = None
    work_mode: Optional[int] = None
    date_posted: Optional[str] = None
    frequency: int = 86400
    delivery_method: int = JobAlertDelivery.EMAIL.value
    is_active: bool = False
    status: int = 0

class BlueprintCreate(BlueprintBase):
    pass

class BlueprintUpdate(BaseModel):
    name: Optional[str] = None
    keywords: Optional[List[str]] = None
    excluded_keywords: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    portal_slug: Optional[str] = None
    companies: Optional[List[str]] = None
    min_salary: Optional[int] = None
    companies: Optional[List[str]] = None
    min_salary: Optional[int] = None

    experience_level: Optional[int] = None
    job_type: Optional[int] = None
    work_mode: Optional[int] = None
    date_posted: Optional[str] = None
    frequency: Optional[int] = None
    delivery_method: Optional[int] = None
    is_active: Optional[bool] = None
    status: Optional[int] = None

class BlueprintResponse(BlueprintBase):
    id: UUID
    user_id: UUID
    id: UUID
    user_id: UUID
    portal: Optional[int] = None
    last_delivered_at: Optional[datetime] = None
    total_deliveries: int
    total_jobs_matched: int
    active_task_status: Optional[str] = None
    snoozed_until: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
