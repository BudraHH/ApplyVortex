from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class SessionCreate(BaseModel):
    refresh_token: str


class SessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    device_name: Optional[str] = None
    device_fingerprint: Optional[str] = None
    ip_address: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    expires_at: datetime
    last_activity_at: datetime
    is_active: bool


class ActiveSessionsResponse(BaseModel):
    sessions: list[SessionResponse]
    active_sessions_count: int
    max_sessions: int


class RevokeSession(BaseModel):
    session_id: UUID
    reason: Optional[str] = None


class RevokeAllSessions(BaseModel):
    reason: Optional[str] = "User logged out from all devices"
