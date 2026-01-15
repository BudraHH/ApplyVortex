from typing import List, Any
from uuid import UUID
from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user.experience import UserExperience
from app.models.skill.experience_skill import UserExperienceSkillMap
from app.repositories.base import BaseRepository
from app.repositories.skill.skill_repository import SkillRepository
from app.repositories.skill.user_skill_repository import UserSkillRepository


class ExperienceRepository(BaseRepository[UserExperience]):
    def __init__(self, session: AsyncSession, skill_repo: SkillRepository, user_skill_repo: UserSkillRepository = None):
        super().__init__(session, UserExperience)
        self.skill_repo = skill_repo
        self.user_skill_repo = user_skill_repo
    
    async def replace_all(self, user_id: UUID, experiences: List[Any]) -> List[UserExperience]:
        # 1. Delete all existing experiences and skill mappings
        subquery = select(UserExperience.id).where(UserExperience.user_id == user_id)
        await self.session.execute(delete(UserExperienceSkillMap).where(
            UserExperienceSkillMap.user_experience_id.in_(subquery)
        ))
        await self.session.execute(delete(UserExperience).where(UserExperience.user_id == user_id))
        
        created_experiences = []
        all_skills_data = []

        # 2. Create new experiences
        for i, exp_obj in enumerate(experiences):
            if hasattr(exp_obj, "model_dump"):
                exp_data = exp_obj.model_dump()
            elif hasattr(exp_obj, "dict"):
                exp_data = exp_obj.dict()
            else:
                exp_data = dict(exp_obj)
            
            skills_data = exp_data.pop("skills", [])
            exp_data.pop("display_order", None) # Avoid duplicate arg
            
            all_skills_data.append(skills_data)

            user_exp = UserExperience(**exp_data, user_id=user_id, display_order=i)
            self.session.add(user_exp)
            created_experiences.append(user_exp)
        
        await self.session.flush()

        # 3. Create skill mappings
        mappings = []
        skill_ids_to_add_to_user = []  # Track skills to add to user's library
        
        for user_exp, skills in zip(created_experiences, all_skills_data):
            if not skills:
                continue
                
            for skill_input in skills:
                skill = None
                
                if isinstance(skill_input, dict) and skill_input.get("id"):
                    skill = await self.skill_repo.get(skill_input["id"])
                
                if not skill:
                    name = skill_input.get("name") if isinstance(skill_input, dict) else skill_input
                    if isinstance(name, str):
                        skill = await self.skill_repo.get_or_create_skill(name)

                if skill:
                    mappings.append(UserExperienceSkillMap(
                        user_experience_id=user_exp.id,
                        skill_id=skill.id
                    ))
                    skill_ids_to_add_to_user.append(skill.id)
        
        if mappings:
            self.session.add_all(mappings)
        
        # 3.5. Add skills to user's skill library if not already present
        if self.user_skill_repo and skill_ids_to_add_to_user:
            await self.user_skill_repo.add_skills_if_not_exists(user_id, skill_ids_to_add_to_user)
            
        await self.session.flush()
        
        # 4. Re-fetch with eager loading for Pydantic validation (prevents MissingGreenlet)
        if created_experiences:
            stmt = (
                select(UserExperience)
                .options(selectinload(UserExperience.skills).selectinload(UserExperienceSkillMap.skill))
                .where(UserExperience.id.in_([e.id for e in created_experiences]))
                .order_by(UserExperience.display_order)
            )
            result = await self.session.execute(stmt)
            return result.scalars().all()
            
        return []
    
    async def get_by_user_id(self, user_id: UUID) -> List[UserExperience]:
        query = (
            select(UserExperience)
            .options(selectinload(UserExperience.skills).selectinload(UserExperienceSkillMap.skill))
            .where(UserExperience.user_id == user_id)
            .order_by(UserExperience.display_order)
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def add_skills(self, experience_id: UUID, skill_ids: List[UUID]) -> None:
        if not skill_ids:
            return
            
        mappings = [
            UserExperienceSkillMap(user_experience_id=experience_id, skill_id=skill_id)
            for skill_id in skill_ids
        ]
        self.session.add_all(mappings)
        await self.session.flush()
