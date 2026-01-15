
import asyncio
from uuid import UUID
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.agent_forge_task import AgentForgeTask
from app.models.job.job import Job

async def check_tasks():
    async with AsyncSessionLocal() as db:
        # Check recent tasks
        stmt = select(AgentForgeTask).order_by(AgentForgeTask.created_at.desc()).limit(20)
        result = await db.execute(stmt)
        tasks = result.scalars().all()
        
        print(f"--- Recent Agent Tasks ({len(tasks)}) ---")
        for t in tasks:
            payload = t.payload or {}
            action = payload.get('action', 'N/A')
            job_id = payload.get('job_id', 'N/A')
            print(f"ID: {t.id} | Type: {t.task_type} | Status: {t.status} | Action: {action} | JobID: {job_id}")

        # Check jobs with deep_scraped_at
        stmt = select(Job).where(Job.deep_scraped_at.is_not(None))
        result = await db.execute(stmt)
        jobs = result.scalars().all()
        print(f"\n--- Deep Scraped Jobs ({len(jobs)}) ---")
        for j in jobs:
            print(f"ID: {j.id} | Title: {j.title} | Deep Scraped At: {j.deep_scraped_at}")

if __name__ == "__main__":
    asyncio.run(check_tasks())
