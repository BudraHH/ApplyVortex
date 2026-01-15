from pydantic import BaseModel, ConfigDict
from typing import List
from uuid import UUID
from app.constants.constants import LanguageAbility


class LanguageCreate(BaseModel):
    language: str
    proficiency: int
    ability: int = LanguageAbility.BOTH.value


class BulkLanguageCreate(BaseModel):
    languages: List[LanguageCreate]


class LanguageResponse(LanguageCreate):
    id: UUID
    proficiency_display: str
    ability_display: str

    model_config = ConfigDict(from_attributes=True)


class BulkLanguageResponse(BaseModel):
    languages: List[LanguageResponse]
    total_count: int
