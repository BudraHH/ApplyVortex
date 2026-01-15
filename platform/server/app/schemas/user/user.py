# app/schemas/user/user.py

import re
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, ConfigDict, Field


class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=200, description="User's full legal name")


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def password_complexity(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        return v


class AdminUserCreate(UserCreate):
    role: str = 'user'
    account_status: str = 'active'
    email_verified: bool = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    model_config = ConfigDict(
        json_schema_extra={
            'example': {
                'email': 'user@example.com',
                'password': 'StrongPassword123!'
            }
        }
    )


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    password: Optional[str] = Field(None, min_length=8)
    marketing_emails_consent: Optional[bool] = None

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            'example': {
                'email': 'newemail@example.com',
                'name': 'Johnny Doe',
                'marketing_emails_consent': False
            }
        }
    )


class UserResponse(UserBase):
    id: UUID
    email_verified: bool
    account_status: str
    is_active: bool
    role: str
    admin_notes: Optional[str] = None
    two_factor_enabled: bool = False
    last_login_ip: Optional[str] = None
    profile_completeness: int = 0
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    
    # Profile Extensions
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    phone_country_code: Optional[str] = None
    timezone: Optional[str] = None
    date_format: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            'example': {
                'id': '123e4567-e89b-12d3-a456-426614174000',
                'email': 'user@example.com',
                'name': 'John Doe',
                'email_verified': True,
                'account_status': 'active',
                'is_active': True,
                'role': 'user',
                'profile_completeness': 85,
                'created_at': '2025-01-01T00:00:00Z',
                'updated_at': '2025-01-01T00:00:00Z'
            }
        }
    )


class AdminNotesUpdate(BaseModel):
    notes: str


class UserStatsResponse(BaseModel):
    credits_remaining: int
    credits_limit: int
    resumes_generated: int
    last_active: Optional[datetime] = None
    last_ip: Optional[str] = None
    signup_date: datetime
    recent_activity: list[dict] = []


class UserListQuery(BaseModel):
    limit: int = 20
    offset: int = 0
    role: Optional[str] = None
    is_active: Optional[bool] = None
    search: Optional[str] = None
    sort_by: Optional[str] = 'joined'
    sort_desc: bool = True

    model_config = ConfigDict(
        json_schema_extra={
            'example': {
                'limit': 20,
                'offset': 0,
                'role': 'user',
                'is_active': True
            }
        }
    )