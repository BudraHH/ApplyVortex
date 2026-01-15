
import asyncio
from sqlalchemy import select
from app.core.database import async_session_maker
from app.models.user.user import User
from app.models.job.user_preference_blueprint import UserBlueprint

async def main():
    async with async_session_maker() as session:
        # Get Blueprints
        result = await session.execute(select(UserBlueprint))
        blueprints = result.scalars().all()
        
        print(f"Found {len(blueprints)} total blueprints.")
        for bp in blueprints:
            print(f"ID: {bp.id}")
            print(f"  Name: {bp.name}")
            print(f"  Total Deliveries: {bp.total_deliveries} (Type: {type(bp.total_deliveries)})")
            print(f"  Total Jobs Matched: {bp.total_jobs_matched} (Type: {type(bp.total_jobs_matched)})")
            print(f"  Created At: {bp.created_at}")
            print(f"  Updated At: {bp.updated_at}")
            print("-" * 20)

if __name__ == "__main__":
    asyncio.run(main())
