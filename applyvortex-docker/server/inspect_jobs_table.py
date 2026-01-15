
import asyncio
from sqlalchemy import text
from app.core.database import async_session_maker

async def main():
    async with async_session_maker() as session:
        # Use a raw SQL query to get column details from information_schema
        # This works for PostgreSQL
        stmt = text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'jobs'
            ORDER BY ordinal_position;
        """)
        result = await session.execute(stmt)
        columns = result.fetchall()
        
        print(f"{'Column Name':<30} | {'Data Type':<15} | {'Nullable'}")
        print("-" * 60)
        for col in columns:
            print(f"{col.column_name:<30} | {col.data_type:<15} | {col.is_nullable}")

if __name__ == "__main__":
    asyncio.run(main())
