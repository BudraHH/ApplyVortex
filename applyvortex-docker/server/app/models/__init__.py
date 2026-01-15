"""
SQLAlchemy models for ApplyVortex.
"""
from .base import Base, metadata
from .mixins import (
    UUIDMixin,
    TimestampMixin,
    SoftDeleteMixin,
    UserOwnedMixin,
    SerializableMixin,
    DisplayOrderMixin,
    FeaturedMixin,
    ActiveMixin,
    VerifiedMixin
)

# User domain - Only import what's actually exported
from .user import (
    User,
    UserProfile,
    UserSession,
    UserProject,
    UserLanguage,
    UserResume,
    UserCertification,
    UserEducation,
    UserExperience,
    UserAccomplishment,
    UserResearch,
    UserNotification
)
from app.models.job.user_preference_blueprint import UserBlueprint
from app.models.agent_forge_task import AgentForgeTask
from app.models.agent_api_key import AgentAPIKey
from app.models.agent import Agent

from .activity.activity import Activity


from .skill.skill import Skill, SkillsCategory
from .skill.user_skill import UserSkillMap
from .skill.project_skill import UserProjectSkillMap
from .skill.experience_skill import UserExperienceSkillMap


from .skill.experience_skill import UserExperienceSkillMap

# Job & Content
from app.models.job.job import Job
from app.models.job.job_application import JobApplication
from app.models.job.cover_letter import UserCoverLetter

# System
from app.models.system.alert import SystemAlert
from app.models.system.usage_credit import SystemUsageCredits

## ...existing code...

__all__ = [
    # Base & Core
    'Base',
    'metadata',

    # Mixins
    'UUIDMixin',
    'TimestampMixin',
    'SoftDeleteMixin',
    'UserOwnedMixin',
    'SerializableMixin',
    'DisplayOrderMixin',
    'FeaturedMixin',
    'ActiveMixin',
    'VerifiedMixin',

    # User models (only what's actually exported)
    'User',
    'UserProfile',
    'UserSession',
    'UserExperience',
    'UserProject',
    'UserResume',
    'UserEducation',
    'UserCertification',
    'UserLanguage',
    'UserAccomplishment',
    'UserResearch',
    'UserNotification',
    
    # Agent & Platform
    'AgentForgeTask',


    # Skill models (TYPE_CHECKING only)
    'Skill',
    'UserSkillMap',
    'UserProjectSkillMap',
    'UserExperienceSkillMap',
    'Activity',
    
    # Enums (all imported from enums/__init__.py)
    
    # Job
    'Job',
    'JobApplication',
    'UserCoverLetter',
    'UserBlueprint',
    
    
    # System
    'SystemAlert',
    'SystemUsageCredits',
]
