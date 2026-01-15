import asyncio
import sys
import os

# Add the current directory (server/) to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
from app.core.database import async_session_maker
from app.models.user.user import User
from app.models.user.profile import UserProfile
from app.models.enums.user_enums import UserRole, AccountStatus, Gender
from app.core.hashing import get_password_hash

async def create_or_promote_superuser(email: str, password: str):
    async with async_session_maker() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalars().first()

        if user:
            print(f"User {email} found. Promoting to SUPER_ADMIN...")
            user.role = UserRole.SUPER_ADMIN
            user.password_hash = get_password_hash(password) # Update password too
            user.account_status = AccountStatus.ACTIVE
            user.email_verified = True
            await session.commit()
            print(f"✅ User {email} updated to SUPER_ADMIN with new password.")
        else:
            print(f"User {email} not found. Creating new SUPER_ADMIN...")
            
            new_user = User(
                email=email,
                password_hash=get_password_hash(password),
                role=UserRole.SUPER_ADMIN,
                account_status=AccountStatus.ACTIVE,
                email_verified=True,
                profile=UserProfile(
                    first_name="Super",
                    last_name="Admin",
                    gender=Gender.OTHER # Default value
                    # Add other mandatory profile fields if any, checking UserProfile model briefly
                )
            )
            session.add(new_user)
            await session.commit()
            print(f"✅ Created new SUPER_ADMIN: {email}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_superuser.py <email> <password>")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    asyncio.run(create_or_promote_superuser(email, password))
