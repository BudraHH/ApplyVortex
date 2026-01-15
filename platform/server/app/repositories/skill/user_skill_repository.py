from typing import List
from uuid import UUID
from sqlalchemy import delete, select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.skill.user_skill import UserSkillMap
from app.repositories.base import BaseRepository
from app.repositories.skill.skill_repository import SkillRepository


from sqlalchemy.orm import selectinload

class UserSkillRepository(BaseRepository[UserSkillMap]):
    def __init__(self, session: AsyncSession, skill_repo: SkillRepository):
        super().__init__(session, UserSkillMap)
        self.skill_repo = skill_repo
    
    async def replace_all(self, user_id: UUID, skills: List[dict]) -> List[UserSkillMap]:
        # 1. DELETE user skills → 1 CALL
        await self.session.execute(delete(UserSkillMap).where(UserSkillMap.user_id == user_id))
        
        # 2. Process skills - prioritize IDs, fallback to names
        bulk_mappings = []
        skills_to_create_by_name = []
        
        for skill_input in skills:
            # Convert Pydantic model to dict if needed
            if hasattr(skill_input, 'model_dump'):
                skill_data = skill_input.model_dump()
            elif hasattr(skill_input, 'dict'):
                skill_data = skill_input.dict()
            else:
                skill_data = skill_input
            
            skill = None
            
            # Prioritize ID if provided
            if skill_data.get('id'):
                try:
                    from uuid import UUID as UUID_TYPE
                    skill_id = UUID_TYPE(skill_data['id'])
                    skill = await self.skill_repo.get(skill_id)
                except (ValueError, TypeError):
                    pass  # Invalid UUID, fallback to name
            
            # Fallback to name-based lookup/creation
            if not skill:
                skills_to_create_by_name.append(skill_data)
            else:
                # Create mapping with existing skill
                mapping = UserSkillMap(
                    user_id=user_id,
                    skill_id=skill.id
                )
                bulk_mappings.append(mapping)
        
        # 3. BULK get_or_create remaining skills by name
        if skills_to_create_by_name:
            skill_names = [s['name'] for s in skills_to_create_by_name]
            skills_dict = await self.skill_repo.bulk_get_or_create_skills(skill_names)
            
            for skill_data in skills_to_create_by_name:
                skill = skills_dict[skill_data['name']]
                mapping = UserSkillMap(
                    user_id=user_id,
                    skill_id=skill.id
                )
                bulk_mappings.append(mapping)
        
        self.session.add_all(bulk_mappings)
        
        # 4. SINGLE COMMIT → IMPLICIT
        await self.session.flush()
        
        # Reload with relationships for response
        query = select(UserSkillMap).where(UserSkillMap.user_id == user_id).options(selectinload(UserSkillMap.skill))
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def get_by_user_id(self, user_id: UUID) -> List[UserSkillMap]:
        query = select(UserSkillMap).where(UserSkillMap.user_id == user_id).options(selectinload(UserSkillMap.skill))
        result = await self.session.execute(query)
        return result.scalars().all()
    
    
    async def add_skills_if_not_exists(self, user_id: UUID, skill_ids: List[UUID]) -> None:
        """
        Add skills to user's skill library if they don't already exist.
        Used when skills are added via projects/experiences.
        Uses ON CONFLICT DO NOTHING to gracefully handle duplicates.
        """
        if not skill_ids:
            return
        
        # Use INSERT ... ON CONFLICT DO NOTHING to handle duplicates gracefully
        from sqlalchemy.dialects.postgresql import insert
        
        # Create values for bulk insert
        values = [
            {
                "user_id": user_id,
                "skill_id": skill_id
            }
            for skill_id in skill_ids
        ]
        
        # Insert with ON CONFLICT DO NOTHING
        stmt = insert(UserSkillMap).values(values)
        stmt = stmt.on_conflict_do_nothing(index_elements=['user_id', 'skill_id'])
        
        await self.session.execute(stmt)
        # Note: Commit is handled by the calling repository
