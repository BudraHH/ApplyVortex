import asyncio
from sqlalchemy import text
from app.core.database import engine

async def patch_database():
    print("🔌 Connecting to database...")
    async with engine.begin() as conn:
        print("🛠️  Adding permanent address columns to user_profiles...")
        
        # Define the columns to add
        columns = [
            "ADD COLUMN IF NOT EXISTS permanent_address VARCHAR(500)",
            "ADD COLUMN IF NOT EXISTS permanent_city VARCHAR(100)",
            "ADD COLUMN IF NOT EXISTS permanent_state VARCHAR(100)",
            "ADD COLUMN IF NOT EXISTS permanent_country VARCHAR(100)",
            "ADD COLUMN IF NOT EXISTS permanent_postal_code VARCHAR(20)"
        ]
        
        # Execute ALTER TABLE for each column
        for col_def in columns:
            try:
                sql = f"ALTER TABLE user_profiles {col_def};"
                await conn.execute(text(sql))
                print(f"   ✅ Executed: {sql}")
            except Exception as e:
                print(f"   ⚠️  Error executing {col_def}: {e}")

    print("🎉 Database patch complete!")

if __name__ == "__main__":
    asyncio.run(patch_database())
