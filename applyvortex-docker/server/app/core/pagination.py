from typing import Generic, TypeVar, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator
from fastapi import Query

T = TypeVar('T')

class PaginationParams(BaseModel):
    limit: int = Field(Query(20, ge=1, le=100), description="Number of items per page")
    offset: int = Field(Query(0, ge=0), description="Skip this many items")
    sort_by: Optional[str] = Field(Query(None), description="Sort field")
    sort_order: str = Field(Query('desc', regex=r'^(asc|desc)$'), description="Sort direction")

    @field_validator('limit')
    @classmethod
    def validate_limit(cls, v):
        return min(v, 100)  # Enforce max limit

    @property
    def page(self) -> int:
        return self.offset // self.limit + 1

    @property
    def has_next(self) -> bool:
        return self.offset + self.limit < 1000  # Arbitrary max

class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    limit: int
    offset: int
    page: int
    pages: int
    has_next: bool
    has_prev: bool

    model_config = ConfigDict(from_attributes=True)
