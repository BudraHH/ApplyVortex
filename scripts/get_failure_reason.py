
import asyncio
import os
import sys

# Add parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/applyvortex-docker/server")

from sqlalchemy import select, desc
from app.core.database import async_session_maker
from app.models.user.resume import UserResume
from app.schemas.user.resume import ParsingStatus

async def get_failure_reason():
    try:
        async with async_session_maker() as session:
            query = select(UserResume).order_by(desc(UserResume.created_at)).limit(1)
            result = await session.execute(query)
            resume = result.scalar_one_or_none()
            
            if resume:
                print(f"Resume ID: {resume.id}")
                print(f"Status: {resume.parsing_status}")
                if resume.parsing_status == ParsingStatus.failed:
                    print(f"ERROR REASON: {resume.parsing_error}")
                else:
                    print("Resume is not in failed state.")
            else:
                print("No resumes found.")
    except Exception as e:
        print(f"Script failed: {e}")

if __name__ == "__main__":
    asyncio.run(get_failure_reason())
