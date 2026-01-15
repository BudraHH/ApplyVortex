
import asyncio
import os
import sys
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import ssl

# Add app path
sys.path.append('/app')

# Import models
from app.models.user.user import User
from app.models.user.profile import UserProfile
from app.models.user.education import UserEducation
from app.models.user.experience import UserExperience
from app.models.user.project import UserProject
from app.models.user.research import UserResearch
from app.models.user.accomplishment import UserAccomplishment
from app.models.user.certification import UserCertification
# Note: Skill maps might be join tables or have specific models. 
# Checking if models exist for skill maps or if they are just association tables.
# Based on previous file listings, we haven't seen specific models for skill maps in the import list explicitly, 
# but they were mentioned in logs (user_project_skill_map). 
# I will try to inspect the UserProject and UserExperience models to access skills via relationships if possible,
# or try a raw SQL query for the maps if models aren't readily available/known.

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fallback
    DATABASE_URL = "postgresql://neondb_owner:npg_pIXv9NKHU3CO@ep-muddy-rain-a47uehdw-pooler.us-east-1.aws.neon.tech/applyvortex_db"

if "postgresql+asyncpg" not in DATABASE_URL and "postgresql://" in DATABASE_URL:
     DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Clean params
import re
if "sslmode=" in DATABASE_URL:
    DATABASE_URL = re.sub(r'([?&])sslmode=[^&]*(&|$)', r'\1', DATABASE_URL)
if "channel_binding=" in DATABASE_URL:
    DATABASE_URL = re.sub(r'([?&])channel_binding=[^&]*(&|$)', r'\1', DATABASE_URL)
DATABASE_URL = DATABASE_URL.rstrip('?&')

TARGET_EMAIL = "hariharabudra@gmail.com"

async def verify():
    # Setup SSL
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
        # 1. Get User
        result = await session.execute(select(User).where(User.email == TARGET_EMAIL))
        user = result.scalars().first()
        
        if not user:
            print(f"User {TARGET_EMAIL} not found!")
            return

        print(f"User ID: {user.id}")

        # 2. Check Profile
        res = await session.execute(select(UserProfile).where(UserProfile.user_id == user.id))
        profile = res.scalars().first()
        print(f"\n--- User Profile ---")
        if profile:
            print(f"Headline: {profile.headline}")
            print(f"Summary: {profile.professional_summary[:50]}..." if profile.professional_summary else "Summary: None")
        else:
            print("Profile: NOT FOUND")

        # 3. Check Education
        res = await session.execute(select(UserEducation).where(UserEducation.user_id == user.id))
        educations = res.scalars().all()
        print(f"\n--- Educations ({len(educations)}) ---")
        for edu in educations:
            print(f"- {edu.institution_name} ({edu.degree_name})")

        # 4. Check Experience
        res = await session.execute(select(UserExperience).where(UserExperience.user_id == user.id))
        experiences = res.scalars().all()
        print(f"\n--- Experiences ({len(experiences)}) ---")
        for exp in experiences:
            print(f"- {exp.company_name} ({exp.job_title})")


        # 5. Check Projects
        res = await session.execute(select(UserProject).where(UserProject.user_id == user.id))
        projects = res.scalars().all()
        print(f"\n--- Projects ({len(projects)}) ---")
        for proj in projects:
             print(f"- {proj.project_name}")

        # 6. Check Research
        res = await session.execute(select(UserResearch).where(UserResearch.user_id == user.id))
        research = res.scalars().all()
        print(f"\n--- Research ({len(research)}) ---")
        for r in research:
            print(f"- {r.title}")

        # 7. Check Accomplishments
        res = await session.execute(select(UserAccomplishment).where(UserAccomplishment.user_id == user.id))
        acc = res.scalars().all()
        print(f"\n--- Accomplishments ({len(acc)}) ---")
        for a in acc:
            print(f"- {a.title}")

        # 8. Check Certifications
        res = await session.execute(select(UserCertification).where(UserCertification.user_id == user.id))
        certs = res.scalars().all()
        print(f"\n--- Certifications ({len(certs)}) ---")
        for c in certs:
             print(f"- {c.name}")

        # 9. Check Skill Maps (Raw SQL for simplicity)
        from sqlalchemy import text
        print(f"\n--- Skill Maps (Counts) ---")
        
        # Project Skills
        try:
            res = await session.execute(text("SELECT count(*) FROM user_project_skill_map JOIN user_projects ON user_project_skill_map.user_project_id = user_projects.id WHERE user_projects.user_id = :uid"), {"uid": user.id})
            p_count = res.scalar()
            print(f"Project-Skill Mappings: {p_count}")
        except Exception as e:
            print(f"Project Skill Check Failed: {e}")

        # Experience Skills
        try:
            # Need to start a new transaction or rollback if previous one failed in raw SQL? 
            # session.rollback() might be needed but we are in async with block.
            # Actually each session.execute in this block is part of same transaction usually.
            res = await session.execute(text("SELECT count(*) FROM user_experience_skill_map JOIN user_experiences ON user_experience_skill_map.user_experience_id = user_experiences.id WHERE user_experiences.user_id = :uid"), {"uid": user.id})
            e_count = res.scalar()
            print(f"Experience-Skill Mappings: {e_count}")
        except Exception as e:
            print(f"Experience Skill Check Failed: {e}")

        # Global Skills table count
        try:
            res = await session.execute(text("SELECT count(*) FROM skills"))
            s_count = res.scalar()
            print(f"Total Unique Skills in DB: {s_count}")
        except Exception as e:
            print(f"Global Skills Check Failed: {e}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(verify())
