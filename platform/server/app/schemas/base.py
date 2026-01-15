from pydantic import BaseModel, Field
from typing import Generic, TypeVar, Optional, List
from uuid import UUID


T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    limit: int
    offset: int
    has_more: bool = Field(default=False)


class SuccessResponse(BaseModel):
    success: bool = True
    message: str


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    code: Optional[str] = None
