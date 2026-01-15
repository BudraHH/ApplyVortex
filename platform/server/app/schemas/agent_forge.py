from typing import Dict, Any, Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, field_validator
from app.constants.constants import TaskStatus


class AgentTaskBase(BaseModel):
    task_type: int
    payload: Dict[str, Any]

class AgentTaskCreate(AgentTaskBase):
    pass

class AgentTaskResponse(AgentTaskBase):
    id: UUID
    status: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.lower()
        return v

class AgentTaskResult(BaseModel):
    task_id: Optional[str] = None  # Made optional since it's in URL path now
    status: int
    result_data: Optional[Dict[str, Any]] = None
    error_log: Optional[str] = None  # Renamed from 'error' to match model

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.lower()
        return v


