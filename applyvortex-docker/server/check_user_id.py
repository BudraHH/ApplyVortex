
import asyncio
from uuid import UUID
from sqlalchemy import select
from app.core.database import async_session_maker
from app.models.user.user import User

async def main():
    async with async_session_maker() as session:
        user_id = UUID("f248457e-9b45-440e-bc0b-b4e5952d5ee5")
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
        
        if user:
            print(f"User ID: {user.id}")
            print(f"Email: {user.email}")
            print(f"Name: {user.first_name if hasattr(user, 'first_name') else 'N/A'}")
        else:
            print("User not found!")

if __name__ == "__main__":
    asyncio.run(main())
