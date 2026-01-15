from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional

class AccountSettingsResponse(BaseModel):
    """
    aggregated response schema for the Account Settings page.
    Combines User (auth/account) info and Profile (personal/regional) preferences.
    """
    # From User table
    email: EmailStr
    is_active: bool
    email_verified: bool
    
    # From UserProfile table
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    phone_number: Optional[str] = None
    phone_country_code: Optional[str] = None
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class AccountSettingsUpdate(BaseModel):
    """
    Schema for updating Account Settings.
    """
    # Personal Info
    full_name: Optional[str] = None
    first_name: Optional[str] = Field(None, min_length=1)
    middle_name: Optional[str] = None
    last_name: Optional[str] = Field(None, min_length=1)
    phone_number: Optional[str] = None
    phone_country_code: Optional[str] = None
    
    # Regional
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    
    # Account Info (Email usually requires specific verification flow, but including if needed)
    # email: Optional[EmailStr] = None 


from pydantic import model_validator, field_validator
import re

class PasswordUpdate(BaseModel):
    """
    Schema for updating user password.
    """
    current_password: str = Field(..., min_length=1, description="Current password for verification")
    new_password: str = Field(..., min_length=8, description="New password (minimum 8 characters)")
    
    @field_validator('new_password')
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        return v

    model_config = ConfigDict(from_attributes=True)
 

class SessionResponse(BaseModel):
    """
    Schema for user session information.
    """
    id: str
    device_name: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    last_activity_at: str
    created_at: str
    is_current: bool = False
    
    model_config = ConfigDict(from_attributes=True)


class SessionsListResponse(BaseModel):
    """
    Schema for listing all user sessions.
    """
    sessions: list[SessionResponse]
    total: int

