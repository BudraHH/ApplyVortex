from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ResearchBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    research_type: Optional[int] = None
    authors: str = Field(..., min_length=2, max_length=300)
    publisher: str = Field(..., min_length=2, max_length=200)
    publication_month: Optional[int] = Field(None, ge=1, le=12)
    publication_year: int = Field(..., ge=1900, le=2100)
    url: Optional[str] = None
    abstract: str = Field(..., min_length=20, max_length=500)
    display_order: int = 0


class ResearchCreate(ResearchBase):
    pass


class ResearchUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    research_type: Optional[int] = None
    authors: Optional[str] = Field(None, min_length=2, max_length=300)
    publisher: Optional[str] = Field(None, min_length=2, max_length=200)
    publication_month: Optional[int] = Field(None, ge=1, le=12)
    publication_year: Optional[int] = Field(None, ge=1900, le=2100)
    url: Optional[str] = None
    abstract: Optional[str] = Field(None, min_length=20, max_length=500)
    display_order: Optional[int] = None


class ResearchResponse(ResearchBase):
    id: UUID
    user_id: UUID
    created_at: object  # datetime
    updated_at: object  # datetime

    model_config = ConfigDict(from_attributes=True)


class BulkResearchCreate(BaseModel):
    research: list[ResearchCreate]


class BulkResearchResponse(BaseModel):
    research: list[ResearchResponse]
    total_count: int
