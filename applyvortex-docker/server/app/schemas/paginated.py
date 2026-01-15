from typing import Generic, TypeVar, List
from pydantic import BaseModel
from uuid import UUID

from .user.user import UserResponse
from .skill.skill import SkillResponse


T = TypeVar('T')


class PaginatedUserResponse(BaseModel, Generic[T]):
    items: List[UserResponse]
    total: int
    limit: int
    offset: int
    has_more: bool = False


class PaginatedSkillResponse(BaseModel, Generic[T]):
    items: List[SkillResponse]
    total: int
    limit: int
    offset: int
    has_more: bool = False
