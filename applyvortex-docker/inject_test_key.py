
import asyncio
import os
import sys
import secrets
# Adjust python path if needed to find app module
sys.path.append('/app')

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# Import models
from app.models.user.user import User
from app.models.agent_api_key import AgentAPIKey

# Setup
load_dotenv = None
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
# Clean weird params if present from manual edits
if "?sslmode=" in DATABASE_URL or "&sslmode=" in DATABASE_URL:
    import re
    DATABASE_URL = re.sub(r'([?&])sslmode=[^&]*(&|$)', r'\1', DATABASE_URL)
if "channel_binding=" in DATABASE_URL:
    import re
    DATABASE_URL = re.sub(r'([?&])channel_binding=[^&]*(&|$)', r'\1', DATABASE_URL)
    
DATABASE_URL = DATABASE_URL.rstrip('?&')
# SSL is handled via connect_args now
# if "ssl=" not in DATABASE_URL and ("?" in DATABASE_URL):
#      DATABASE_URL += "&ssl=require"
# elif "ssl=" not in DATABASE_URL:
#      DATABASE_URL += "?ssl=require"

# Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TARGET_EMAIL = "hariharabudra@gmail.com"
TARGET_KEY_PLAIN = "apf_agent_TEST_KEY_DEV_MODE_12345"
DEVICE_ID_FIXED = "00000000-0000-0000-0000-000000000001"

async def inject_key():
    print(f"Connecting to DB: {DATABASE_URL.split('@')[-1]}") # Log safe part
    
    # Custom SSL Context to match server robustness
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    engine = create_async_engine(
        DATABASE_URL,
        connect_args={
            "timeout": 30,
            "ssl": ctx,
            "statement_cache_size": 0
        }
    )
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # 1. Find User
        stmt = select(User).where(User.email == TARGET_EMAIL)
        result = await session.execute(stmt)
        user = result.scalars().first()

        if not user:
            print(f"ERROR: User {TARGET_EMAIL} not found! Please sign up first.")
            return False

        print(f"Found User: {user.id}")

        # 2. Check/Delete Existing Test Key
        stmt = select(AgentAPIKey).where(AgentAPIKey.key_prefix.like("apf_agent_TEST_%"))
        result = await session.execute(stmt)
        existing = result.scalars().all()
        for k in existing:
            await session.delete(k)
        
        if existing:
            print(f"Deleted {len(existing)} old test keys.")

        # 3. Create New Key
        key_hash = pwd_context.hash(TARGET_KEY_PLAIN)
        
        new_key = AgentAPIKey(
            user_id=user.id,
            key_hash=key_hash,
            key_prefix="apf_agent_TEST_", # Use readable prefix
            name="Dev Test Agent",
            device_id=DEVICE_ID_FIXED,
            is_active=True
        )
        
        session.add(new_key)
        await session.commit()
        print(f"SUCCESS: Injected key for {TARGET_EMAIL}")
        print(f"Key: {TARGET_KEY_PLAIN}")
        
    await engine.dispose()
    return True

if __name__ == "__main__":
    success = asyncio.run(inject_key())
    sys.exit(0 if success else 1)
