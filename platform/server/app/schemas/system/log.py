from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class SystemLogBase(BaseModel):
    action: str
    status: str
    user_id: Optional[UUID] = None
    ip_address: Optional[str] = None
    duration_ms: int = 0
    details: Optional[Dict[str, Any]] = None
    resource_id: Optional[UUID] = None

class SystemLogResponse(SystemLogBase):
    id: UUID
    created_at: datetime

    # Include user info if joined, though typically we might just return user_id
    # We can handle enrichment in frontend or expanding this model later.
    # For now, simplistic mapping.
    user_email: Optional[str] = None # Helper field if we join user

    model_config = ConfigDict(from_attributes=True)

class SystemLogListQuery(BaseModel):
    limit: int = 50
    offset: int = 0
    action: Optional[str] = None
    status: Optional[str] = None
    user_id: Optional[UUID] = None
