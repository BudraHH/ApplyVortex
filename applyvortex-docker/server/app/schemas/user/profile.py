from pydantic import BaseModel, ConfigDict, field_validator, Field
from typing import Optional, List
from datetime import datetime

from app.constants.constants import WorkMode


class LanguageItem(BaseModel):
    """Language entry with proficiency and ability"""
    name: str
    name: str
    proficiency: int  # 1: Native, 2: Fluent, etc.
    ability: int = 3  # 3: Both, 1: Read/Write, 2: Spoken


class ProfileCreate(BaseModel):
    # Structured name fields
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    gender: Optional[int] = None
    
    
    phone_number: Optional[str] = Field(default=None, description="Phone number without country code")
    phone_country_code: Optional[str] = Field(default="+91", description="Country code (e.g., +91, +1)")
    alternate_phone: Optional[str] = None
    alternate_phone_country_code: Optional[str] = None
    
    # Current Address
    current_address: Optional[str] = None
    current_city: Optional[str] = None
    current_state: Optional[str] = None
    current_country: Optional[str] = 'India'
    current_postal_code: Optional[str] = None
    
    # Permanent Address
    permanent_address: Optional[str] = None
    permanent_city: Optional[str] = None
    permanent_state: Optional[str] = None
    permanent_country: Optional[str] = None
    permanent_postal_code: Optional[str] = None
    
    headline: Optional[str] = None
    professional_summary: Optional[str] = None
    current_role: Optional[str] = None
    current_company: Optional[str] = None
    years_of_experience: Optional[float] = 0.0
    willing_to_relocate: Optional[bool] = True

    preferred_work_mode: Optional[int] = WorkMode.ONSITE.value
    job_search_status: Optional[int] = None
    availability: Optional[int] = None
    notice_period_days: Optional[int] = None
    
    expected_salary_min: Optional[int] = None
    expected_salary_max: Optional[int] = None
    salary_currency: Optional[str] = 'INR'

    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    leetcode_url: Optional[str] = None
    naukri_url: Optional[str] = None
    stackoverflow_url: Optional[str] = None
    medium_url: Optional[str] = None
    personal_website: Optional[str] = None
    
    # Regional Settings
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    
    # Languages
    languages: Optional[List[LanguageItem]] = []

    @field_validator('phone_number', 'alternate_phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """Validate phone number - should be digits only without country code"""
        if v is None or v == '':
            return None
        
        # Strip spaces/dashes
        v = v.strip().replace(" ", "").replace("-", "")
        
        # Check if it's just digits (6-15 characters)
        if not v.isdigit():
            raise ValueError('Phone number should contain only digits')
        
        if len(v) < 6 or len(v) > 15:
            raise ValueError('Phone number should be between 6 and 15 digits')
        
        return v
    
    @field_validator('phone_country_code', 'alternate_phone_country_code')
    @classmethod
    def validate_country_code(cls, v: Optional[str]) -> Optional[str]:
        """Validate country code format"""
        if v is None or v == '':
            return None
        
        # Strip spaces
        v = v.strip()
        
        # Should start with + and have 1-4 digits
        if not v.startswith('+'):
            v = '+' + v
        
        # Remove the + and check if rest are digits
        code = v[1:]
        if not code.isdigit():
            raise ValueError('Country code should contain only digits after +')
        
        if len(code) < 1 or len(code) > 4:
            raise ValueError('Country code should be 1-4 digits')
        
        return v


    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            'example': {
                'first_name': 'John',
                'middle_name': 'Michael',
                'last_name': 'Doe',
                'phone_number': '9876543210',
                'phone_country_code': '+91',
                'current_city': 'Chennai',
                'current_state': 'Tamil Nadu',
                'headline': 'Full Stack Developer | React + FastAPI',
                'years_of_experience': 3.5
            }
        }
    )




class ProfileResponse(BaseModel):
    """Profile response schema - no validation on read operations"""
    # User info
    email: str
    
    # Personal Information
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    gender: int
    
    # Phone numbers with country codes
    phone_number: Optional[str] = None
    phone_country_code: Optional[str] = "+91"
    alternate_phone: Optional[str] = None
    alternate_phone_country_code: Optional[str] = None
    
    # Professional Identity
    headline: Optional[str] = None
    professional_summary: Optional[str] = None
    current_role: Optional[str] = None
    current_company: Optional[str] = None
    years_of_experience: Optional[float] = 0.0
    
    # Current Address
    current_address: Optional[str] = None
    current_city: Optional[str] = None
    current_state: Optional[str] = None
    current_country: Optional[str] = 'India'
    current_postal_code: Optional[str] = None
    
    # Permanent Address
    permanent_address: Optional[str] = None
    permanent_city: Optional[str] = None
    permanent_state: Optional[str] = None
    permanent_country: Optional[str] = None
    permanent_postal_code: Optional[str] = None
    willing_to_relocate: Optional[bool] = True

    
    # Job Search Status
    preferred_work_mode: Optional[int] = WorkMode.ONSITE.value
    job_search_status: Optional[int] = None
    availability: Optional[int] = None
    notice_period_days: Optional[int] = None
    
    # Salary Expectations
    expected_salary_min: Optional[int] = None
    expected_salary_max: Optional[int] = None
    salary_currency: Optional[str] = 'INR'
    
    # Professional Links
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    leetcode_url: Optional[str] = None
    naukri_url: Optional[str] = None
    stackoverflow_url: Optional[str] = None
    medium_url: Optional[str] = None
    personal_website: Optional[str] = None
    
    # Regional Settings
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    
    # Languages
    languages: Optional[List[LanguageItem]] = []
    
    # Metadata
    profile_completeness: int
    last_updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            'example': {
                'email': 'john.doe@example.com',
                'first_name': 'John',
                'middle_name': 'Michael',
                'last_name': 'Doe',
                'gender': 'Male',
                'phone_number': '9876543210',
                'phone_country_code': '+91',
                'current_city': 'Chennai',
                'current_state': 'Tamil Nadu',
                'headline': 'Full Stack Developer | React + FastAPI',
                'years_of_experience': 3.5,
                'profile_completeness': 85,
                'last_updated_at': '2025-01-01T00:00:00Z'
            }
        }
    )



class ProfileUpdate(BaseModel):
    # Structured name fields
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[int] = None
    
    phone_number: Optional[str] = None
    phone_country_code: Optional[str] = None
    alternate_phone: Optional[str] = None
    alternate_phone_country_code: Optional[str] = None
    
    # Current Address
    current_address: Optional[str] = None
    current_city: Optional[str] = None
    current_state: Optional[str] = None
    current_country: Optional[str] = None
    current_postal_code: Optional[str] = None
    
    # Permanent Address
    permanent_address: Optional[str] = None
    permanent_city: Optional[str] = None
    permanent_state: Optional[str] = None
    permanent_country: Optional[str] = None
    permanent_postal_code: Optional[str] = None
    
    headline: Optional[str] = None
    professional_summary: Optional[str] = None
    current_role: Optional[str] = None
    current_company: Optional[str] = None
    years_of_experience: Optional[float] = None
    willing_to_relocate: Optional[bool] = None

    preferred_work_mode: Optional[int] = None
    job_search_status: Optional[int] = None
    availability: Optional[int] = None
    notice_period_days: Optional[int] = None
    
    expected_salary_min: Optional[int] = None
    expected_salary_max: Optional[int] = None
    salary_currency: Optional[str] = None

    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    leetcode_url: Optional[str] = None
    naukri_url: Optional[str] = None
    stackoverflow_url: Optional[str] = None
    medium_url: Optional[str] = None
    personal_website: Optional[str] = None
    
    # Regional Settings
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    
    # Languages
    languages: Optional[List[LanguageItem]] = None

    @field_validator('phone_number', 'alternate_phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """Validate phone number - should be digits only without country code"""
        if v is None or v == '':
            return None
        
        # Strip spaces
        v = v.strip().replace(" ", "").replace("-", "")
        
        # Check if it's just digits (6-15 characters)
        if not v.isdigit():
            raise ValueError('Phone number should contain only digits')
        
        if len(v) < 6 or len(v) > 15:
            raise ValueError('Phone number should be between 6 and 15 digits')
        
        return v
    
    @field_validator('phone_country_code', 'alternate_phone_country_code')
    @classmethod
    def validate_country_code(cls, v: Optional[str]) -> Optional[str]:
        """Validate country code format"""
        if v is None or v == '':
            return None
        
        # Strip spaces
        v = v.strip()
        
        # Should start with + and have 1-4 digits
        if not v.startswith('+'):
            v = '+' + v
        
        # Remove the + and check if rest are digits
        code = v[1:]
        if not code.isdigit():
            raise ValueError('Country code should contain only digits after +')
        
        if len(code) < 1 or len(code) > 4:
            raise ValueError('Country code should be 1-4 digits')
        
        return v


    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            'example': {
                'first_name': 'John',
                'last_name': 'Updated',
                'phone_number': '+919876543211',
                'willing_to_relocate': True
            }
        }
    )
