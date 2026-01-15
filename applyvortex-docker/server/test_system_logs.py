
import asyncio
import sys
import os

# Add support for importing from server root
sys.path.append(os.path.join(os.getcwd(), 'server'))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.system.system_log import SystemLog

async def check_logs():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(SystemLog).order_by(SystemLog.created_at.desc()).limit(5))
        logs = result.scalars().all()
        
        print(f"\nFound {len(logs)} recent logs:")
        for log in logs:
            print(f"- [{log.created_at}] {log.action} | {log.status} | {log.duration_ms}ms | User: {log.user_id}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "check":
        asyncio.run(check_logs())
    else:
        print("Usage: python test_system_logs.py check")
