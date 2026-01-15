
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

# Hardcoded from docker-compose.yml just in case specific env loading is weird
# asyncpg uses ssl=require query param or connect_args
DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_pIXv9NKHU3CO@ep-muddy-rain-a47uehdw-pooler.us-east-1.aws.neon.tech/applyvortex_db"

async def check_error():
    # Pass ssl context via connect_args
    engine = create_async_engine(DATABASE_URL, echo=False, connect_args={"ssl": "require"})
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        try:
            # Raw SQL to avoid model import issues
            result = await session.execute(text("SELECT id, parsing_status, parsing_error FROM user_resumes ORDER BY created_at DESC LIMIT 1"))
            row = result.fetchone()
            if row:
                print(f"ID: {row[0]}")
                print(f"Status: {row[1]}")
                print(f"Error: {row[2]}")
            else:
                print("No rows found")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            await session.close()
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_error())
