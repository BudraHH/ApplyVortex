from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.job.user_preference_blueprint import UserBlueprint
from app.schemas.job.blueprint import BlueprintCreate, BlueprintUpdate
from app.constants.constants import Portal

class BlueprintRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_user_id(self, user_id: UUID) -> List[UserBlueprint]:
        """Get all blueprints for a user with active scraping status."""
        stmt = select(UserBlueprint).where(UserBlueprint.user_id == user_id)
        result = await self.session.execute(stmt)
        blueprints = list(result.scalars().all())

        # Enrich with active scraping status
        from app.models.agent_forge_task import AgentForgeTask
        from app.constants.constants import TaskStatus, AgentTaskType

        for bp in blueprints:
            # Check for running/pending SCRAPE tasks
            # We look for SCRAPE(1) tasks associated with this blueprint
            # that are PENDING(1) or IN_PROGRESS(2)
            task_stmt = select(AgentForgeTask).where(
                AgentForgeTask.blueprint_id == bp.id,
                AgentForgeTask.task_type == AgentTaskType.SCRAPE, 
                AgentForgeTask.status.in_([TaskStatus.PENDING.value, TaskStatus.IN_PROGRESS.value])
            ).limit(1)
            
            task_res = await self.session.execute(task_stmt)
            active_task = task_res.scalar_one_or_none()
            
            if active_task:
                bp.active_task_status = "SCRAPING"
            else:
                 bp.active_task_status = "IDLE"

        return blueprints

    async def get_active_by_user_id(self, user_id: UUID) -> Optional[UserBlueprint]:
        """Get the primary active blueprint for a user."""
        result = await self.session.execute(
            select(UserBlueprint).where(
                UserBlueprint.user_id == user_id,
                UserBlueprint.is_active == True
            ).limit(1)
        )
        return result.scalar_one_or_none()

    async def create(self, user_id: UUID, profile_in: BlueprintCreate) -> UserBlueprint:
        """Create a new blueprint."""
        data = profile_in.model_dump()
        
        # Handle portal mapping (slug -> int)
        portal_slug = data.pop("portal_slug", None)
        if portal_slug:
            slug_map = {
                "linkedin": Portal.LINKEDIN.value,
                "naukri": Portal.NAUKRI.value,
                "indeed": Portal.INDEED.value,
                "glassdoor": Portal.GLASSDOOR.value
            }
            # Use the mapped value, or default to OTHER if unknown
            data["portal"] = slug_map.get(portal_slug.lower(), Portal.OTHER.value)


        profile = UserBlueprint(
            **data,
            user_id=user_id
        )
        self.session.add(profile)
        await self.session.flush()
        return profile

    async def update(self, blueprint_id: UUID, profile_in: BlueprintUpdate) -> Optional[UserBlueprint]:
        """Update an existing blueprint."""
        obj_data = profile_in.model_dump(exclude_unset=True)
        
        # Handle portal mapping (slug -> int)
        if "portal_slug" in obj_data:
            portal_slug = obj_data.pop("portal_slug")
            if portal_slug:
                slug_map = {
                    "linkedin": Portal.LINKEDIN.value,
                    "naukri": Portal.NAUKRI.value,
                    "indeed": Portal.INDEED.value,
                    "glassdoor": Portal.GLASSDOOR.value
                }
                obj_data["portal"] = slug_map.get(portal_slug.lower(), Portal.OTHER.value)

        query = (
            update(UserBlueprint)
            .where(UserBlueprint.id == blueprint_id)
            .values(**obj_data)
            .returning(UserBlueprint)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()



    async def delete(self, blueprint_id: UUID) -> bool:
        """Delete a blueprint."""
        query = delete(UserBlueprint).where(UserBlueprint.id == blueprint_id)
        result = await self.session.execute(query)
        return result.rowcount > 0

    async def get(self, blueprint_id: UUID) -> Optional[UserBlueprint]:
        """Get a single blueprint by ID."""
        result = await self.session.execute(
            select(UserBlueprint).where(UserBlueprint.id == blueprint_id)
        )
        return result.scalar_one_or_none()
