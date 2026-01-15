
import asyncio
import os
import sys
import ssl
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def get_task_result():
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
    
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT result FROM agent_forge_tasks WHERE id='762cc8e1-28c8-438b-ad1e-1c2f35b38557'"))
        val = res.scalar()
        print(val)
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(get_task_result())
