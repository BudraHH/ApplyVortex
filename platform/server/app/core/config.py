# app/core/config.py

import os
from functools import lru_cache
from typing import List, Optional, Union
from pydantic import AnyHttpUrl, Field, validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PREMIUM_FEATURES_ENABLED: bool = Field(False, description="Enable premium features globally")
    """
    Application Configuration
    """
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        case_sensitive=True,
        extra='ignore'
    )

    # --------------------------------------------------------------------------
    # Project Info
    # --------------------------------------------------------------------------
    PROJECT_NAME: str = Field("ApplyVortex", description="Application name")
    VERSION: str = Field("1.0.0", description="Application version")
    API_V1_STR: str = Field("/api/v1", description="API Version 1 prefix")
    ENVIRONMENT: str = Field("development", description="Env: development, staging, production")
    DEBUG: bool = Field(False, description="Enable debug mode")
    LOG_LEVEL: str = Field("INFO", description="Logging level")

    # --------------------------------------------------------------------------
    # CORS & Connectivity
    # --------------------------------------------------------------------------
    FRONTEND_URL: str = Field("http://localhost:3000", description="Primary Frontend URL")
    
    # Used by CORSMiddleware
    BACKEND_CORS_ORIGINS: List[str] = Field(
        [
            "http://localhost:3000",
            "http://localhost:8000",
            "http://127.0.0.1:3000", 
            "http://127.0.0.1:8000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://apply-vortex.vercel.app"
        ],
        description="List of allowed CORS origins"
    )
    
    # Used by TrustedHostMiddleware
    ALLOWED_HOSTS: List[str] = Field(["*"], description="Allowed hosts")

    # --------------------------------------------------------------------------
    # Database
    # --------------------------------------------------------------------------
    DATABASE_URL: str = Field(..., env="DATABASE_URL")

    # --------------------------------------------------------------------------
    # Security - JWT
    # --------------------------------------------------------------------------
    SECRET_KEY: str = Field(..., min_length=32, description="JWT Secret Key")
    ALGORITHM: str = Field("HS256", description="Encryption algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(1440, description="Access token expiry in minutes (1 day)")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(20, description="Refresh token expiry in days")

    # --------------------------------------------------------------------------
    # Security - Account Protection
    # --------------------------------------------------------------------------
    PASSWORD_MIN_LENGTH: int = Field(8, description="Minimum password length")
    MAX_LOGIN_ATTEMPTS: int = Field(5, description="Max failed login attempts before lock")
    ACCOUNT_LOCK_TIME_MINUTES: int = Field(15, description="Account lock duration in minutes")
    MAX_SESSIONS_PER_USER: int = Field(5, description="Max concurrent sessions allowed per user")

    # --------------------------------------------------------------------------
    # Email / SMTP
    # --------------------------------------------------------------------------
    SMTP_SERVER: Optional[str] = Field(None, description="SMTP Server Address")
    SMTP_PORT: int = Field(587, description="SMTP Port")
    SMTP_USER: Optional[str] = Field(None, description="SMTP Username")
    SMTP_PASSWORD: Optional[str] = Field(None, description="SMTP Password")
    EMAIL_FROM: str = Field("noreply@example.com", description="Default sender email")

    # --------------------------------------------------------------------------
    # Rate Limits
    # --------------------------------------------------------------------------
    RATE_LIMIT_MINUTE: int = Field(120, description="General requests per minute")
    RATE_LIMIT_HOUR: int = Field(1000, description="General requests per hour")
    RATE_LIMIT_DAY: int = Field(5000, description="General requests per day")
    
    # Auth Specific Limits
    LOGIN_ATTEMPTS_PER_MINUTE: int = Field(5, description="Login attempts allowed per minute")
    LOGIN_ATTEMPTS_PER_HOUR: int = Field(20, description="Login attempts allowed per hour")

    # --------------------------------------------------------------------------
    # Application Feature Limits
    # --------------------------------------------------------------------------
    SKILL_SEARCH_PER_MINUTE: int = Field(30, description="Max skill searches per minute")
    SKILL_SEARCH_MAX_RESULTS: int = Field(50, description="Max results returned per search")
    
    RESUME_UPLOAD_SIZE_MB: int = Field(5, description="Max resume upload size in MB")
    RESUME_UPLOADS_PER_DAY: int = Field(10, description="Max resume uploads allowed per day")
    
    PREMIUM_JOBS_PER_DAY: int = Field(100, description="Premium user job application limit")
    FREE_JOBS_PER_DAY: int = Field(10, description="Free user job application limit")

    # --------------------------------------------------------------------------
    # File Storage (Cloudflare R2)
    # --------------------------------------------------------------------------
    R2_ENDPOINT_URL: str = Field(..., description="Cloudflare R2 endpoint URL")
    R2_ACCESS_KEY_ID: str = Field(..., description="R2 access key ID")
    R2_SECRET_ACCESS_KEY: str = Field(..., description="R2 secret access key")
    R2_BUCKET_NAME: str = Field(..., description="R2 bucket name")
    R2_PUBLIC_URL: Optional[str] = Field(None, description="R2 public URL (optional)")
    
    # --------------------------------------------------------------------------
    # Redis
    # --------------------------------------------------------------------------
    REDIS_URL: str = Field("redis://redis:6379/0", description="Redis connection URL")



    # --------------------------------------------------------------------------
    # Computed Properties
    # --------------------------------------------------------------------------
    @property
    def asyncpg_url(self) -> str:
        """Helper to get the Async URL (primary)"""
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
        # asyncpg specific parameter normalization
        if "sslmode=" in url:
            url = url.replace("sslmode=require", "ssl=require")
            url = url.replace("sslmode=prefer", "ssl=prefer")
            url = url.replace("sslmode=disable", "ssl=disable")
            url = url.replace("sslmode=allow", "ssl=allow")
            
        if "channel_binding=" in url:
            # Remove channel_binding parameter as it's not supported by asyncpg
            import re
            url = re.sub(r'([?&])channel_binding=[^&]*(&|$)', r'\1', url)
            url = url.rstrip('?&')
            
        return url

    @property
    def sync_database_url(self) -> str:
        """Helper to get Sync URL for Alembic migrations"""
        return self.DATABASE_URL.replace("postgresql+asyncpg", "postgresql")

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()