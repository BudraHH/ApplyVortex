
import asyncio
import os
import sys
from sqlalchemy import select, or_

# Add current directory to path
sys.path.append(os.getcwd())

from app.core.database import AsyncSessionLocal
from app.models.agent_forge_task import AgentForgeTask
from app.constants.constants import TaskStatus

async def reset_stuck_tasks():
    async with AsyncSessionLocal() as db:
        # Find tasks that are FAILED or IN_PROGRESS (orphaned)
        stmt = select(AgentForgeTask).where(
            or_(
                AgentForgeTask.status == TaskStatus.FAILED.value,
                AgentForgeTask.status == TaskStatus.IN_PROGRESS.value
            )
        )
        result = await db.execute(stmt)
        tasks = result.scalars().all()
        
        if not tasks:
            print("No stuck tasks found.")
            return

        for task in tasks:
            print(f"Resetting task {task.id} (Type: {task.task_type}, Current Status: {task.status}) to PENDING({TaskStatus.PENDING.value})")
            task.status = TaskStatus.PENDING.value
            task.error_log = None
            task.assigned_agent_id = None
        
        await db.commit()
        print(f"Successfully reset {len(tasks)} tasks.")

if __name__ == "__main__":
    asyncio.run(reset_stuck_tasks())
