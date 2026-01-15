
import asyncio
import os
import sys

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/applyvortex-docker/server")

from sqlalchemy import select, desc
from app.core.database import async_session_maker
from app.models.user.resume import UserResume

async def check_latest_resume():
    async with async_session_maker() as session:
        query = select(UserResume).order_by(desc(UserResume.created_at)).limit(1)
        result = await session.execute(query)
        resume = result.scalar_one_or_none()
        
        if resume:
            print(f"Latest Resume ID: {resume.id}")
            print(f"File Name: {resume.file_name}")
            print(f"Parsing Status: {resume.parsing_status}")
            print(f"Created At: {resume.created_at}")
            print(f"Parsed Data: {str(resume.parsed_data)[:100]}...") # Truncate
            if resume.parsing_error:
                 print(f"Parsing Error: {resume.parsing_error}")
        else:
            print("No resumes found.")

if __name__ == "__main__":
    asyncio.run(check_latest_resume())
