from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from uuid import UUID


class CertificationCreate(BaseModel):
    name: str
    issuing_organization: str
    
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    does_not_expire: bool = False
    
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None


class BulkCertificationCreate(BaseModel):
    certifications: List[CertificationCreate]


class CertificationResponse(CertificationCreate):
    id: UUID
    is_valid: bool
    is_expired: bool
    expiry_status: str

    model_config = {"from_attributes": True}


class BulkCertificationResponse(BaseModel):
    certifications: List[CertificationResponse]
    total_count: int
