from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.skill.skill_repository import SkillRepository
from app.schemas.skill.skill import SkillSearchQuery, SkillResponse, BulkSkillResponse
from app.core.dependencies import get_db
from app.services.cache.redis_service import cached


class SkillService:
    def __init__(self, db: AsyncSession = None, skill_repo: SkillRepository = None):
        self.db = db
        self.skill_repo = skill_repo or SkillRepository(db)
    
    @cached(ttl_seconds=300, key_builder=lambda f, self, q: f"cache:skills:search:{q.query}:{q.category}:{q.limit}:{q.verified_only}")
    async def search_skills(self, query_params: SkillSearchQuery) -> BulkSkillResponse:
        """Fuzzy search skills for autocomplete/dropdown"""
        skills = await self.skill_repo.search_fuzzy(
            query=query_params.query,
            limit=query_params.limit,
            verified_only=query_params.verified_only
        )
        
        return BulkSkillResponse(
            skills=[SkillResponse.model_validate(skill) for skill in skills],
            total_count=len(skills)
        )
    
    async def get_popular_skills(self, category: str = None, limit: int = 20) -> List[SkillResponse]:
        """Get trending/verified skills by category"""
        skills = await self.skill_repo.get_popular_skills(limit=limit, category=category)
        return [SkillResponse.model_validate(skill) for skill in skills]
    
    async def get_or_create_skill(self, name: str) -> SkillResponse:
        """Get existing skill or create unverified one"""
        skill = await self.skill_repo.get_or_create_skill(name)
        return SkillResponse.model_validate(skill)
    
    async def bulk_get_or_create_skills(self, skill_names: List[str]) -> Dict[str, SkillResponse]:
        """Bulk operation for resume parsing"""
        skills_dict = await self.skill_repo.bulk_get_or_create_skills(skill_names)
        return {name: SkillResponse.model_validate(skill) for name, skill in skills_dict.items()}
