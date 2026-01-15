from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import Settings
from app.models.base import Base

import ssl

settings = Settings()

# Create a custom SSL context that skips verification to avoid timeout issues
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

engine = create_async_engine(
    settings.asyncpg_url, 
    echo=True,
    connect_args={
        "timeout": 30,
        "ssl": ctx,
        "statement_cache_size": 0
    }
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

# Alias for worker usage to be explicit
async_session_maker = AsyncSessionLocal

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def close_db():
    await engine.dispose()

async def get_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
