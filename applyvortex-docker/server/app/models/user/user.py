# app/models/user/user.py

from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from uuid import UUID

from sqlalchemy import String, Boolean, Integer, DateTime, Text, ARRAY, SmallInteger
from sqlalchemy.dialects.postgresql import INET
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin, SoftDeleteMixin
from app.constants.constants import (
    AccountStatus, UserRole
)

if TYPE_CHECKING:
    from app.models.user.profile import UserProfile
    from app.models.user.session import UserSession
    from app.models.user.experience import UserExperience
    from app.models.user.education import UserEducation
    from app.models.user.project import UserProject
    from app.models.user.certification import UserCertification
    from app.models.user.resume import UserResume
    from app.models.user.language import UserLanguage
    from app.models.skill.user_skill import UserSkillMap
    from app.models.activity.activity import Activity
    from app.models.user.accomplishment import UserAccomplishment
    # from app.models.billing.subscription import Subscription
    # from app.models.billing.payment import Payment
    from app.models.job.cover_letter import UserCoverLetter
    from app.models.system.usage_credit import SystemUsageCredits
    from app.models.job.user_job_map import UserJobMap


class User(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"
    
    # Authentication
    email: Mapped[str] = mapped_column(
        String(255), 
        unique=True, 
        nullable=False, 
        index=True
    )
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verification_token: Mapped[Optional[str]] = mapped_column(String(255))
    email_verification_token_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )
    password_hash: Mapped[Optional[str]] = mapped_column(String(255))
    
    # Password Reset
    password_reset_token: Mapped[Optional[str]] = mapped_column(String(255))
    password_reset_token_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )
    password_changed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )
    
    # OAuth
    oauth_provider: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    oauth_provider_id: Mapped[Optional[str]] = mapped_column(String(255))
    oauth_access_token: Mapped[Optional[str]] = mapped_column(Text)
    oauth_refresh_token: Mapped[Optional[str]] = mapped_column(Text)
    oauth_token_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )
    
    # Account Status
    account_status: Mapped[int] = mapped_column(
        SmallInteger, 
        default=AccountStatus.PENDING.value,
        index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    role: Mapped[int] = mapped_column(
        SmallInteger, 
        default=UserRole.USER.value,
        index=True
    )
    
    # Security
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    last_login_ip: Mapped[Optional[str]] = mapped_column(INET)
    
    # Two-Factor Authentication
    two_factor_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    two_factor_secret: Mapped[Optional[str]] = mapped_column(String(255))
    two_factor_backup_codes: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text))
    
    # Session Management
    active_sessions_count: Mapped[int] = mapped_column(Integer, default=0)
    max_sessions: Mapped[int] = mapped_column(Integer, default=5)
    
    # Compliance (GDPR)
    terms_accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    privacy_policy_accepted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )
    marketing_emails_consent: Mapped[bool] = mapped_column(Boolean, default=False)
    data_processing_consent: Mapped[bool] = mapped_column(Boolean, default=True)

    # Admin
    admin_notes: Mapped[Optional[str]] = mapped_column(Text)
    
    # Relationships
    profile: Mapped[Optional["UserProfile"]] = relationship(
        "UserProfile",
        back_populates="user", 
        uselist=False, 
        cascade="all, delete-orphan"
    )
    sessions: Mapped[List["UserSession"]] = relationship(
        "UserSession",
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    agent_api_keys: Mapped[List["AgentAPIKey"]] = relationship(
        "AgentAPIKey", 
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    agents: Mapped[List["Agent"]] = relationship(
        "Agent",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    experiences: Mapped[List["UserExperience"]] = relationship(
        "UserExperience",
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    educations: Mapped[List["UserEducation"]] = relationship(
        "UserEducation",
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    projects: Mapped[List["UserProject"]] = relationship(
        "UserProject",
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    certifications: Mapped[List["UserCertification"]] = relationship(
        "UserCertification",
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    accomplishments: Mapped[List["UserAccomplishment"]] = relationship(
        "UserAccomplishment",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    research: Mapped[List["UserResearch"]] = relationship(
        "UserResearch",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    resumes: Mapped[List["UserResume"]] = relationship(
        "UserResume",
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    languages: Mapped[List["UserLanguage"]] = relationship(
        "UserLanguage",
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    skills: Mapped[List["UserSkillMap"]] = relationship(
        "UserSkillMap",
        back_populates="user", 
        cascade="all, delete-orphan",
        foreign_keys="[UserSkillMap.user_id]"
    )
    activities: Mapped[List["Activity"]] = relationship(
        "Activity",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    applications: Mapped[List["JobApplication"]] = relationship(
        "JobApplication",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    user_job_maps: Mapped[List["UserJobMap"]] = relationship(
        "UserJobMap",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # Billing & Content
    # subscription: Mapped[Optional["Subscription"]] = relationship(
    #     "Subscription",
    #     back_populates="user",
    #     uselist=False,
    #     cascade="all, delete-orphan"
    # )
    # payments: Mapped[List["Payment"]] = relationship(
    #     "Payment",
    #     back_populates="user",
    #     cascade="all, delete-orphan"
    # )
    usage_credits: Mapped[List["SystemUsageCredits"]] = relationship(
        "SystemUsageCredits",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    cover_letters: Mapped[List["UserCoverLetter"]] = relationship(
        "UserCoverLetter",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    @property
    def user_id(self) -> UUID:
        return self.id
    

    @property
    def is_admin(self) -> bool:
        return self.role in [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value]
    
    @property
    def is_locked(self) -> bool:
        if self.locked_until is None:
            return False
        return self.locked_until > datetime.now(timezone.utc)
    
    @property
    def has_password(self) -> bool:
        return self.password_hash is not None
    
    @property
    def is_oauth_user(self) -> bool:
        return self.oauth_provider is not None
    
    @property
    def name(self) -> Optional[str]:
        return self.profile.full_name if self.profile else None
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"