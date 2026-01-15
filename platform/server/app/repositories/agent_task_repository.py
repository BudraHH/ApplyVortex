from typing import List, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent_forge_task import AgentForgeTask
from app.constants.constants import TaskStatus
from app.repositories.base import BaseRepository

class AgentTaskRepository(BaseRepository[AgentForgeTask]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, AgentForgeTask)

    async def create_task(self, user_id: UUID, task_type: int, payload: dict, blueprint_id: Optional[UUID] = None) -> AgentForgeTask:
        task = AgentForgeTask(
            user_id=user_id,
            task_type=task_type,
            payload=payload,
            status=TaskStatus.PENDING.value,
            blueprint_id=blueprint_id
        )
        return await self.create(task)

    async def cancel_active_tasks_for_blueprint(self, blueprint_id: UUID, task_type: Optional[int] = None):
        """Cancel PENDING or IN_PROGRESS tasks for this blueprint. Optionally filter by task type."""
        from sqlalchemy import update, and_
        
        conditions = [
            AgentForgeTask.blueprint_id == blueprint_id,
            AgentForgeTask.status.in_([TaskStatus.PENDING.value, TaskStatus.IN_PROGRESS.value])
        ]
        
        if task_type is not None:
            conditions.append(AgentForgeTask.task_type == task_type)
            
        stmt = (
            update(AgentForgeTask)
            .where(and_(*conditions))
            .values(status=TaskStatus.CANCELLED.value)
        )
        await self.session.execute(stmt)

    async def get_pending_tasks(self, user_id: UUID) -> List[AgentForgeTask]:
        stmt = select(AgentForgeTask).where(
            AgentForgeTask.user_id == user_id,
            AgentForgeTask.status == TaskStatus.PENDING.value
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
