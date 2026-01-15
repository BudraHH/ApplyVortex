from typing import Optional
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel
from app.constants.constants import AgentStatus
class AgentSystemInfo(BaseModel):
    hostname: str
    os: str
    os_release: Optional[str] = None
    machine: Optional[str] = None
    python_version: Optional[str] = None
    processor: Optional[str] = None
    ram: Optional[str] = None

class AgentRegister(BaseModel):
    agent_id: str
    system_info: Optional[AgentSystemInfo] = None
    
    # Legacy fields (keep for backward compat if needed, or map from system_info)
    hostname: Optional[str] = None
    platform: Optional[str] = None
    version: str = "1.0.0"
    name: Optional[str] = None
    user_token: Optional[str] = None # For potential future token-based linking

class AgentHeartbeat(BaseModel):
    agent_id: str
    status: int = AgentStatus.ONLINE.value
    active_tasks: list = []

class AgentMetrics(BaseModel):
    total_tasks_assigned: int
    total_tasks_completed: int
    total_tasks_failed: int
    success_rate: float
    average_execution_time_seconds: float
    last_task_completed_at: Optional[datetime]

class AgentRateLimitUpdate(BaseModel):
    max_tasks_per_hour: int

class AgentResponse(BaseModel):
    id: UUID
    agent_id: str
    name: Optional[str]
    hostname: str
    platform: str
    version: str
    status: int
    last_heartbeat: Optional[datetime]
    created_at: datetime
    
    # Performance metrics
    total_tasks_completed: int = 0
    total_tasks_failed: int = 0
    success_rate: float = 0.0
    average_execution_time_seconds: float = 0.0
    
    # Rate limiting
    max_tasks_per_hour: int = 60
    tasks_this_hour: int = 0
    rate_limit_reset_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
