from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AccomplishmentBase(BaseModel):
    title: str
    category: Optional[int] = None
    description: Optional[str] = None
    display_order: int = 0

class AccomplishmentCreate(AccomplishmentBase):
    pass

class AccomplishmentUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[int] = None
    description: Optional[str] = None
    display_order: Optional[int] = None

class AccomplishmentResponse(AccomplishmentBase):
    id: UUID
    user_id: UUID
    created_at: object # datetime
    updated_at: object # datetime

    model_config = ConfigDict(from_attributes=True)

class BulkAccomplishmentCreate(BaseModel):
    accomplishments: list[AccomplishmentCreate]

class BulkAccomplishmentResponse(BaseModel):
    accomplishments: list[AccomplishmentResponse]
    total_count: int
