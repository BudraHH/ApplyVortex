
import asyncio
from sqlalchemy import select
from app.core.database import async_session_maker
from app.models.user.user import User
from app.models.job.user_preference_blueprint import UserBlueprint

async def main():
    async with async_session_maker() as session:
        # Get User
        result = await session.execute(select(User).where(User.email == 'hariharabudra@gmail.com'))
        user = result.scalars().first()
        
        if not user:
            print("User not found!")
            return

        print(f"User ID: {user.id}")

        # Get Blueprints
        result = await session.execute(select(UserBlueprint).where(UserBlueprint.user_id == user.id))
        blueprints = result.scalars().all()
        
        print(f"Found {len(blueprints)} blueprints.")
        for bp in blueprints:
            print(f"ID: {bp.id}")
            print(f"  Name: {bp.name}")
            print(f"  Portal: {bp.portal}")
            print(f"  Active: {bp.is_active}")
            print(f"  AutoScrape: {bp.auto_scrape}")
            print(f"  AutoApply: {bp.auto_apply}")
            print("-" * 20)

if __name__ == "__main__":
    asyncio.run(main())
