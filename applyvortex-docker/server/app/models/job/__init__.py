"""
Job domain models for ApplyVortex.
"""
from typing import TYPE_CHECKING

from .job import Job
from .job_application import JobApplication
from .job_match import JobMatchAnalysis
from .user_preference_blueprint import UserBlueprint
from .user_job_map import UserJobMap
from .cover_letter import UserCoverLetter

if TYPE_CHECKING:
    from app.models.user.user import User

__all__ = [
    'Job',
    'JobApplication',
    'JobMatchAnalysis',
    'UserBlueprint',
    'UserJobMap',
    'UserCoverLetter'
]
