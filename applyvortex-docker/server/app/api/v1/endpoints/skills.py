from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_db, get_current_user, get_current_active_user, get_skill_service, get_user_skill_service
from app.schemas.skill.skill import SkillSearchQuery, BulkSkillResponse, SkillResponse
from app.schemas.skill.user_skill import BulkUserSkillCreate, BulkUserSkillResponse
from app.models.user.user import User

router = APIRouter()

# Skill Search (Public - Autocomplete)
@router.get("/search", response_model=BulkSkillResponse)
async def search_skills(
    query_params: SkillSearchQuery = Depends(),
    skill_service=Depends(get_skill_service),
    db: AsyncSession = Depends(get_db)
):
    """Fuzzy search skills for autocomplete/dropdown"""
    return await skill_service.search_skills(query_params)

@router.get("/popular", response_model=List[SkillResponse])
async def get_popular_skills(
    category: str = None,
    limit: int = 20,
    skill_service=Depends(get_skill_service),
    db: AsyncSession = Depends(get_db)
):
    """Get trending/verified skills by category"""
    return await skill_service.get_popular_skills(category=category, limit=limit)

# User Skills (Profile Management)
@router.post("/profile/skills", response_model=BulkUserSkillResponse)
async def replace_user_skills(
    data: BulkUserSkillCreate,
    current_user: User = Depends(get_current_active_user),
    user_skill_service=Depends(get_user_skill_service),
    db: AsyncSession = Depends(get_db)
):
    """Replace ALL user skills + auto-create missing skills (resume parser UX)"""
    return await user_skill_service.replace_all(current_user.id, data)

@router.get("/profile/skills", response_model=BulkUserSkillResponse)
async def get_user_skills(
    current_user: User = Depends(get_current_user),
    user_skill_service=Depends(get_user_skill_service),
    db: AsyncSession = Depends(get_db)
):
    """Get ALL user skills with proficiency levels"""
    return await user_skill_service.get_user_skills(current_user.id)


