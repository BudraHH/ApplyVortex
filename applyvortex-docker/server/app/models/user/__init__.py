"""
User domain models for ApplyVortex.
"""
from .user import User
from .notification import UserNotification
from .session import UserSession
from .profile import UserProfile
from .experience import UserExperience
from .education import UserEducation
from .project import UserProject
from .certification import UserCertification
from .resume import UserResume
from .language import UserLanguage
from .accomplishment import UserAccomplishment
from .research import UserResearch

# Lazy load other models to prevent circular imports
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .experience import UserExperience
    from .education import UserEducation
    from .project import UserProject
    from .certification import UserCertification
    from .resume import UserResume
    from .language import UserLanguage

__all__ = [
    'User',
    'UserProfile',
    'UserSession',
    'UserExperience',
    'UserEducation',
    'UserProject',
    'UserCertification',
    'UserResume',
    'UserLanguage',
    'UserAccomplishment',
    'UserResearch',
    'UserNotification',
]
