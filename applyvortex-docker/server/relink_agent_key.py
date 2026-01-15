import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user.user import User
from app.models.agent_api_key import AgentAPIKey

async def main():
    target_email = "hariharabudra@gmail.com"
    
    async with AsyncSessionLocal() as db:
        # 1. Find User
        stmt = select(User).where(User.email == target_email)
        result = await db.execute(stmt)
        user = result.scalars().first()
        
        if not user:
            print(f"User {target_email} not found!")
            # Debug: list all users
            res_all = await db.execute(select(User))
            users = res_all.scalars().all()
            print("Available users:")
            for u in users:
                print(f"- {u.email} (ID: {u.id})")
            return

        print(f"Found User: {user.email} (ID: {user.id})")
        
        # 2. Find Agent Key (Get the first available key)
        stmt_key = select(AgentAPIKey)
        result_key = await db.execute(stmt_key)
        key = result_key.scalars().first()
        
        if not key:
            print("No Agent Key found in DB!")
            return
            
        print(f"Found Agent Key: ID {key.id}, Current User ID: {key.user_id}")
        
        # 3. Update Link
        if key.user_id != user.id:
            print(f"Relinking key to user {user.id}...")
            key.user_id = user.id
            await db.commit()
            print("Successfully relinked Agent Key to User.")
        else:
            print("Key is already linked to this user.")

if __name__ == "__main__":
    asyncio.run(main())
