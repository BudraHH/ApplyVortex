
import asyncio
from sqlalchemy import text
from app.core.database import async_session_maker

async def main():
    async with async_session_maker() as session:
        # List tables
        print("--- TABLES ---")
        stmt = text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
        tables = (await session.execute(stmt)).scalars().all()
        for t in tables:
            print(t)
        
        # List Columns for JOBS
        print("\n--- JOBS Columns ---")
        stmt = text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'jobs' ORDER BY ordinal_position;")
        cols = (await session.execute(stmt)).fetchall()
        for c in cols:
            print(f"{c[0]} ({c[1]})")

        # List Columns for JOB_MATCHES (if exists)
        if 'job_matches' in tables:
            print("\n--- JOB_MATCHES Columns ---")
            stmt = text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'job_matches' ORDER BY ordinal_position;")
            cols = (await session.execute(stmt)).fetchall()
            for c in cols:
                print(f"{c[0]} ({c[1]})")

if __name__ == "__main__":
    asyncio.run(main())
