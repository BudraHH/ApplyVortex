
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text
from app.models.agent_forge_task import AgentForgeTask
from app.models.user.user import User
from app.core.config import settings

# Force env load if needed (assuming .env is present or vars are set)
# DATABASE_URL = os.getenv("DATABASE_URL")

async def check_tasks():
    db_url = settings.DATABASE_URL
    if db_url and "postgresql://" in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
    
    # Asyncpg doesn't like sslmode in query params usually, asks for ssl=True/Context
    connect_args = {}
    if "sslmode" in db_url or "neon.tech" in db_url:
         import ssl
         ctx = ssl.create_default_context()
         ctx.check_hostname = False
         ctx.verify_mode = ssl.CERT_NONE
         connect_args["ssl"] = ctx
         # Remove query params that might confuse it
         if "?" in db_url:
             db_url = db_url.split("?")[0]

    print(f"Connecting to DB: {db_url.split('@')[1] if '@' in db_url else '...'}")
    
    engine = create_async_engine(db_url, echo=False, connect_args=connect_args)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # 1. List Recent Tasks
        print("\n--- Recent Tasks ---")
        stmt = select(AgentForgeTask).order_by(AgentForgeTask.created_at.desc()).limit(5)
        result = await session.execute(stmt)
        tasks = result.scalars().all()
        
        if not tasks:
            print("No tasks found.")
        else:
            for t in tasks:
                print(f"Task {t.id} | Type: {t.task_type} | Status: {t.status} | Agent: {t.assigned_agent_id} | Created: {t.created_at}")
                print(f"  User: {t.user_id}")
                print(f"  Payload: {str(t.payload)[:100]}...")

        # 2. Check Agents
        print("\n--- Agents ---")
        result = await session.execute(text("SELECT id, agent_id, user_id, status FROM agents"))
        agents = result.fetchall()
        for a in agents:
             print(f"Agent DB ID: {a[0]} | AgentID: {a[1]} | Status: {a[3]}")
             
        # 3. Simulate Query
        if tasks and agents:
             print("\n--- Simulation ---")
             user_id = tasks[0].user_id
             # agent_id_str = str(agents[0][0]) # Agent DB ID
             
             # Check pending for this user
             stmt = select(AgentForgeTask).where(
                AgentForgeTask.user_id == user_id,
                AgentForgeTask.status == 'PENDING'
            )
             res = await session.execute(stmt)
             pending = res.scalars().all()
             print(f"Pending tasks for user {user_id}: {len(pending)}")

    await engine.dispose()

if __name__ == "__main__":
    import sys
    # Add project root to path
    sys.path.append(os.getcwd())
    asyncio.run(check_tasks())
