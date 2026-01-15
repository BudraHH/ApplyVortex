
import asyncio
import os
import ssl
import json
import ast
from uuid import UUID
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.models.user.user import User
from app.api.v1.endpoints.agent_forge import submit_task_result
from app.schemas.agent_forge import AgentTaskResult
from app.core.dependencies import get_complete_profile_service

async def resync_last_task():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if "postgresql+asyncpg" not in DATABASE_URL and "postgresql://" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    engine = create_async_engine(
        DATABASE_URL,
        connect_args={
            "ssl": ctx,
            "statement_cache_size": 0
        }
    )
    
    AsyncSessionLocal = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    # Read the task result
    with open("task_result.json", "r") as f:
        # It's a python dict string, not JSON
        raw_result_str = f.read()
        result_data = ast.literal_eval(raw_result_str)

    async with AsyncSessionLocal() as session:
        # Get the user
        res = await session.execute(select(User).where(User.email == 'hariharabudra@gmail.com'))
        user = res.scalar()
        
        if not user:
            print("User not found")
            return

        # Mock the dependency injection parts or just call the sync logic?
        # Re-sync logic is inside submit_task_result in agent_forge.py
        # I'll just manually call the same logic or use the endpoint function if possible.
        
        # Actually, let's just use the repo/service directly if possible, 
        # but to be safe and use my recent fixes, I'll just re-trigger the sync block.
        
        # I'll import the business logic parts.
        from app.api.v1.endpoints.agent_forge import submit_task_result
        from app.schemas.agent_forge import AgentTaskResult
        
        # We need a task ID
        task_id = '762cc8e1-28c8-438b-ad1e-1c2f35b38557'
        
        # We need to mock the dependencies for the FastAPI endpoint if we call it directly.
        # It's easier to just copy-paste the sync logic into a temporary script or 
        # just call the endpoint function with mocked deps.
        
        # Actually, let's just run the sync logic manually here to be 100% sure it works.
        # But wait, I already fixed it in agent_forge.py.
        
        print(f"Re-syncing data for user {user.id} using task {task_id} result...")
        
        # Mocking the call to submit_task_result
        # This is tricky because of Depends.
        
    await engine.dispose()

if __name__ == "__main__":
    # Actually, I'll just use a one-off script that uses my FIXES to populate the DB correctly now.
    pass
