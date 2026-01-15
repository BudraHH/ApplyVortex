
import asyncio
import os
import sys

# Add parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/applyvortex-docker/server")

from sqlalchemy import select, update
from app.core.database import async_session_maker
from app.models.user.resume import UserResume
from app.schemas.user.resume import ParsingStatus

async def reset_stuck_resumes():
    async with async_session_maker() as session:
        # Find resumes stuck in processing
        query = select(UserResume).where(UserResume.parsing_status == ParsingStatus.processing)
        result = await session.execute(query)
        stuck_resumes = result.scalars().all()
        
        count = 0
        for resume in stuck_resumes:
            print(f"Resetting resume {resume.id} from 'processing' to 'failed'...")
            resume.parsing_status = ParsingStatus.failed
            resume.parsing_error = "System restart detected. Please retry upload."
            count += 1
            
        if count > 0:
            await session.commit()
            print(f"Successfully reset {count} stuck resumes.")
        else:
            print("No stuck resumes found.")

if __name__ == "__main__":
    asyncio.run(reset_stuck_resumes())
