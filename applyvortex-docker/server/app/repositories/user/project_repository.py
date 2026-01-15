from typing import List
from uuid import UUID
from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload  # Import
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user.project import UserProject
from app.models.skill.project_skill import UserProjectSkillMap
from app.repositories.base import BaseRepository
from app.repositories.skill.skill_repository import SkillRepository
from app.repositories.skill.user_skill_repository import UserSkillRepository


class ProjectRepository(BaseRepository[UserProject]):
    def __init__(self, session: AsyncSession, skill_repo: SkillRepository, user_skill_repo: UserSkillRepository = None):
        super().__init__(session, UserProject)
        self.skill_repo = skill_repo
        self.user_skill_repo = user_skill_repo
    
    async def replace_all(self, user_id: UUID, projects: List[any]) -> List[UserProject]:
        # 1. Delete all existing projects and skill mappings
        subquery = select(UserProject.id).where(UserProject.user_id == user_id)
        await self.session.execute(delete(UserProjectSkillMap).where(
            UserProjectSkillMap.user_project_id.in_(subquery)
        ))
        await self.session.execute(delete(UserProject).where(UserProject.user_id == user_id))
        
        bulk_projects = []
        project_skills_list = []

        # 2. Prepare Data
        for i, p_obj in enumerate(projects):
            # Convert Pydantic to dict if needed
            p_data = p_obj.model_dump() if hasattr(p_obj, "model_dump") else dict(p_obj)
            
            # Extract skills and clean dict
            skills_data = p_data.pop("skills", []) or []
            p_data.pop("display_order", None)
            
            bulk_projects.append(UserProject(**p_data, user_id=user_id, display_order=i))
            project_skills_list.append(skills_data)

        self.session.add_all(bulk_projects)
        await self.session.flush()  # Get IDs
        
        # 3. Handle Skills Mappings
        bulk_mappings = []
        skill_ids_to_add_to_user = []  # Track skills to add to user's library
        
        for project, skills_data in zip(bulk_projects, project_skills_list):
            for skill_entry in skills_data:
                skill = None
                
                # Prioritize ID if provided (dict with 'id' field)
                if isinstance(skill_entry, dict) and skill_entry.get("id"):
                    skill = await self.skill_repo.get(skill_entry["id"])
                
                # Fallback to name-based lookup/creation
                if not skill:
                    # Extract skill name from different formats
                    if isinstance(skill_entry, str):
                        # Direct string: "React", "Node.js", etc.
                        skill_name = skill_entry
                    elif isinstance(skill_entry, dict):
                        # Dict with 'name' field: {"name": "React", ...}
                        skill_name = skill_entry.get("name")
                    else:
                        # Pydantic model or object with 'name' attribute
                        skill_name = getattr(skill_entry, "name", None)
                    
                    if skill_name:
                        skill = await self.skill_repo.get_or_create_skill(skill_name)
                
                if skill:
                    bulk_mappings.append(UserProjectSkillMap(
                        user_project_id=project.id,
                        skill_id=skill.id
                    ))
                    skill_ids_to_add_to_user.append(skill.id)
        
        if bulk_mappings:
            self.session.add_all(bulk_mappings)
        
        # 3.5. Add skills to user's skill library if not already present
        if self.user_skill_repo and skill_ids_to_add_to_user:
            await self.user_skill_repo.add_skills_if_not_exists(user_id, skill_ids_to_add_to_user)
        
        # 4. SINGLE COMMIT → 1 CALL (implicit in session)
        await self.session.flush()

        # 5. Reload with full relationships (Project -> Map -> Skill)
        # We must fetch them fresh to ensure Pydantic serialization works without implicit IO
        query = select(UserProject).where(UserProject.id.in_([p.id for p in bulk_projects])) \
            .options(selectinload(UserProject.skills).selectinload(UserProjectSkillMap.skill)) \
            .order_by(UserProject.display_order)
        
        result = await self.session.execute(query)
        bulk_projects = result.scalars().all()
        
        return bulk_projects
    
    async def get_by_user_id(self, user_id: UUID) -> List[UserProject]:
        query = select(UserProject).where(UserProject.user_id == user_id) \
            .options(selectinload(UserProject.skills).selectinload(UserProjectSkillMap.skill)) \
            .order_by(UserProject.display_order)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_featured_projects(self, user_id: UUID, limit: int = 3) -> List[UserProject]:
        query = select(UserProject).where(
            UserProject.user_id == user_id, 
            UserProject.is_featured == True
        ) \
        .options(selectinload(UserProject.skills).selectinload(UserProjectSkillMap.skill)) \
        .order_by(UserProject.display_order) \
        .limit(limit)
        
        result = await self.session.execute(query)
        return result.scalars().all()

    async def add_skills(self, project_id: UUID, skill_ids: List[UUID]) -> None:
        if not skill_ids:
            return
            
        mappings = [
            UserProjectSkillMap(user_project_id=project_id, skill_id=skill_id)
            for skill_id in skill_ids
        ]
        self.session.add_all(mappings)
        await self.session.flush()
