from pydantic import BaseModel
from typing import Optional, List


class UserSkillCreate(BaseModel):
    id: Optional[str] = None
    name: str


class BulkUserSkillCreate(BaseModel):
    skills: List[UserSkillCreate]


class UserSkillResponse(BaseModel):
    model_config = {"from_attributes": True}
    
    id: str
    name: str
    category: int
    sub_category: int


class BulkUserSkillResponse(BaseModel):
    skills: List[UserSkillResponse]
    total_count: int
