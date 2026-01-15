from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from uuid import UUID

class SkillSearchQuery(BaseModel):
    query: Optional[str] = ""
    category: Optional[str] = None
    limit: int = 20
    verified_only: bool = False


class SkillCreate(BaseModel):
    name: str
    category: Optional[str] = None
    aliases: Optional[List[str]] = None


class SkillResponse(BaseModel):
    id: UUID
    name: str
    category: int
    sub_category: int
    
    model_config = ConfigDict(from_attributes=True)


class BulkSkillResponse(BaseModel):
    skills: List[SkillResponse]
    total_count: int
