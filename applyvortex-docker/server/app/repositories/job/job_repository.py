from typing import List, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import logging
from app.models.job.job import Job
from app.repositories.base import BaseRepository
from sqlalchemy.dialects.postgresql import insert

logger = logging.getLogger(__name__)


class JobRepository(BaseRepository[Job]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Job)
    
    async def bulk_upsert(self, user_id: UUID, jobs: List[dict]) -> List[Job]:
        """
        Inserts new jobs (global registry) and links them to the user.
        """
        from app.models.job.user_job_map import UserJobMap
        from app.constants.constants import Portal
        
        try:
            processed_jobs = []
            for data in jobs:
                # Prepare global job data
                portal = data.pop("portal", None) or data.pop("job_portal_id", None) or data.pop("portal_slug", None)
                if not portal:
                    portal = Portal.LINKEDIN.value # Default fallback
                
                # Cleanup old key if present
                data.pop("portal_slug", None)
                
                # Fix Mapped Column Name mismatch (job_metadata -> metadata)
                if "job_metadata" in data:
                    data["metadata"] = data.pop("job_metadata")
                
                # Check mapping if scraper still sends strings
                if isinstance(portal, str):
                    portal_lower = portal.lower()
                    if "linkedin" in portal_lower:
                        portal = Portal.LINKEDIN.value
                    elif "naukri" in portal_lower:
                        portal = Portal.NAUKRI.value
                    elif "indeed" in portal_lower:
                        portal = Portal.INDEED.value
                    elif "glassdoor" in portal_lower:
                        portal = Portal.GLASSDOOR.value
                    else:
                        portal = Portal.OTHER.value
                
                # Map scraper 'job_url' to model 'job_post_url'
                job_url = data.pop("job_url", None)
                if not data.get("job_post_url"):
                    data["job_post_url"] = job_url or data.pop("apply_url", None)

                # Map is_easy_apply to application_method
                is_easy = data.pop("is_easy_apply", False)
                if is_easy:
                    # Import locally to avoid circulars if needed, or use raw int 1 (EASY_APPLY)
                    # ApplicationMethod.EASY_APPLY = 1
                    data["application_method"] = 1 
                
                # Helper to parse string fields to Enum ints
                from app.constants.constants import WorkMode, JobType
                
                if isinstance(data.get("work_mode"), str):
                    w_lower = data["work_mode"].lower()
                    if "remote" in w_lower: data["work_mode"] = WorkMode.REMOTE.value
                    elif "hybrid" in w_lower: data["work_mode"] = WorkMode.HYBRID.value
                    elif "on-site" in w_lower or "onsite" in w_lower: data["work_mode"] = WorkMode.ONSITE.value
                    else: data.pop("work_mode") # clean invalid

                if isinstance(data.get("job_type"), str):
                    j_lower = data["job_type"].lower()
                    if "full" in j_lower: data["job_type"] = JobType.FULL_TIME.value
                    elif "part" in j_lower: data["job_type"] = JobType.PART_TIME.value
                    elif "contract" in j_lower: data["job_type"] = JobType.CONTRACT.value
                    elif "intern" in j_lower: data["job_type"] = JobType.INTERNSHIP.value
                    elif "freelance" in j_lower: data["job_type"] = JobType.FREELANCE.value
                    else: data.pop("job_type") # clean invalid
                    
                insert_data = {
                    **data,
                    "portal": portal,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "scraped_at": data.get("scraped_at") or datetime.utcnow()
                }
                
                # Step 1: Global Job Upsert
                stmt = insert(Job.__table__).values(**insert_data)
                stmt = stmt.on_conflict_do_update(
                    index_elements=['portal', 'external_id'],
                    set_={
                        'title': stmt.excluded.title,
                        'company_name': stmt.excluded.company_name,
                        'location_city': stmt.excluded.location_city,
                        'description': stmt.excluded.description,
                        'job_type': stmt.excluded.job_type,
                        'experience_level': stmt.excluded.experience_level,
                        'salary_min': stmt.excluded.salary_min,
                        'salary_max': stmt.excluded.salary_max,
                        'salary_currency': stmt.excluded.salary_currency,
                        'scraped_at': insert_data["scraped_at"],
                        'updated_at': datetime.utcnow()
                    }
                ).returning(Job.id)
                
                result = await self.session.execute(stmt)
                job_id = result.scalar_one()

                # Step 2: Junction Table Upsert
                assoc_stmt = insert(UserJobMap.__table__).values(
                    user_id=user_id,
                    job_id=job_id,
                    scraped_at=insert_data["scraped_at"],
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                ).on_conflict_do_update(
                    constraint='uq_user_job_map_user_job',
                    set_={'scraped_at': datetime.utcnow(), 'updated_at': datetime.utcnow()}
                )
                await self.session.execute(assoc_stmt)
            
            await self.session.commit()
            return []
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Failed to bulk upsert jobs: {e}")
            raise

    async def bulk_upsert_enriched(self, user_id: UUID, jobs_enriched: List[dict]) -> None:
        """
        Upsert enriched jobs (from AI) and their match scores.
        """
        # from sqlalchemy.dialects.postgresql import insert
        from decimal import Decimal
        from app.models.job.job_match import JobMatchAnalysis
        from app.models.job.user_job_map import UserJobMap
        from app.constants.constants import Portal, JobMatchQuality

        try:
            for i, data in enumerate(jobs_enriched):
                try:
                    # Extract AI Match Data first (so we don't try to insert them into Job table)
                    match_score = data.pop("match_score", 0)
                    missing_skills = data.pop("missing_skills", [])
                    
                    # Granular scores - Optional (might be None)
                    skill_match = data.pop("skill_match", None)
                    experience_match = data.pop("experience_match", None)
                    location_match = data.pop("location_match", None)
                    salary_match = data.pop("salary_match", None)
                    
                    # Extra Analysis Data (now being captured)
                    reasoning = data.pop("reasoning", None) or data.pop("ai_reasoning", None)
                    matched_skills = data.pop("matched_skills", []) 
                    skill_gap_recommendations = data.pop("skill_gap_recommendations", []) 

                    # Leftovers to discard (not in Job or Analysis model)
                    data.pop("seniority_fit", None)
                    data.pop("ai_decision", None) 
                    data.pop("decision", None)

                    # Helper to convert to 0-1 range decimal
                    def to_decimal(val, default=0):
                        if val is None: return Decimal(default)
                        d = Decimal(str(val))
                        return d / 100 if d > 1 else d

                    # Prepare job data
                    portal = data.pop("portal", None) or data.pop("job_portal_id", None) or data.pop("portal_slug", None)
                    if not portal:
                        portal = Portal.LINKEDIN.value
                    
                    if isinstance(portal, str):
                        portal_lower = portal.lower()
                        if "linkedin" in portal_lower:
                            portal = Portal.LINKEDIN.value
                        elif "naukri" in portal_lower:
                            portal = Portal.NAUKRI.value
                        elif "indeed" in portal_lower:
                            portal = Portal.INDEED.value
                        elif "glassdoor" in portal_lower:
                            portal = Portal.GLASSDOOR.value
                        else:
                            portal = Portal.OTHER.value
                    
                    data.pop("portal_slug", None)
                    
                    # Fix Mapped Column Name mismatch (job_metadata -> metadata)
                    if "job_metadata" in data:
                        data["metadata"] = data.pop("job_metadata")
                    
                    job_url = data.pop("job_url", None)
                    if not data.get("job_post_url"):
                        data["job_post_url"] = job_url or data.pop("apply_url", None)

                    # Map is_easy_apply -> application_method
                    is_easy = data.pop("is_easy_apply", False)
                    if is_easy:
                         data["application_method"] = 1 # EASY_APPLY

                    # Helper to parse string fields to Enum ints
                    from app.constants.constants import WorkMode, JobType
                    
                    if isinstance(data.get("work_mode"), str):
                        w_lower = data["work_mode"].lower()
                        if "remote" in w_lower: data["work_mode"] = WorkMode.REMOTE.value
                        elif "hybrid" in w_lower: data["work_mode"] = WorkMode.HYBRID.value
                        elif "on-site" in w_lower or "onsite" in w_lower: data["work_mode"] = WorkMode.ONSITE.value
                        else: data.pop("work_mode")

                    if isinstance(data.get("job_type"), str):
                        j_lower = data["job_type"].lower()
                        if "full" in j_lower: data["job_type"] = JobType.FULL_TIME.value
                        elif "part" in j_lower: data["job_type"] = JobType.PART_TIME.value
                        elif "contract" in j_lower: data["job_type"] = JobType.CONTRACT.value
                        elif "intern" in j_lower: data["job_type"] = JobType.INTERNSHIP.value
                        elif "freelance" in j_lower: data["job_type"] = JobType.FREELANCE.value
                        else: data.pop("job_type")

                    job_insert_data = {
                        **data,
                        "portal": portal,
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow(),
                        "scraped_at": data.get("scraped_at") or datetime.utcnow()
                    }

                    # Step 1: Global Job Upsert
                    stmt = insert(Job.__table__).values(**job_insert_data)
                    stmt = stmt.on_conflict_do_update(
                        index_elements=['portal', 'external_id'],
                        set_={
                            'title': stmt.excluded.title,
                            'company_name': stmt.excluded.company_name,
                            'location_city': stmt.excluded.location_city,
                            'description': stmt.excluded.description,
                            'job_type': stmt.excluded.job_type,
                            'experience_level': stmt.excluded.experience_level,
                            'salary_min': stmt.excluded.salary_min,
                            'salary_max': stmt.excluded.salary_max,
                            'salary_currency': stmt.excluded.salary_currency,
                            'scraped_at': job_insert_data["scraped_at"],
                            'updated_at': datetime.utcnow()
                        }
                    ).returning(Job.id)
                    
                    result = await self.session.execute(stmt)
                    job_id = result.scalar_one()

                    # Step 2: Junction Table Upsert
                    assoc_stmt = insert(UserJobMap.__table__).values(
                        user_id=user_id,
                        job_id=job_id,
                        scraped_at=job_insert_data["scraped_at"],
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    ).on_conflict_do_update(
                        constraint='uq_user_job_map_user_job',
                        set_={'scraped_at': datetime.utcnow(), 'updated_at': datetime.utcnow()}
                    )
                    await self.session.execute(assoc_stmt)

                    # Step 3: Match Score Upsert
                    base_match_dec = to_decimal(match_score)
                    
                    final_skill = to_decimal(skill_match) if skill_match is not None else base_match_dec
                    final_experience = to_decimal(experience_match) if experience_match is not None else base_match_dec
                    final_location = to_decimal(location_match) if location_match is not None else Decimal(1.0)
                    final_salary = to_decimal(salary_match) if salary_match is not None else Decimal(1.0)

                    # Calculate Match Quality Flag
                    quality = JobMatchQuality.WEAK.value
                    if base_match_dec >= 0.8:
                        quality = JobMatchQuality.STRONG.value
                    elif base_match_dec >= 0.6:
                        quality = JobMatchQuality.GOOD.value
                    elif base_match_dec >= 0.4:
                        quality = JobMatchQuality.FAIR.value

                    match_stmt = insert(JobMatchAnalysis.__table__).values(
                        user_id=user_id,
                        job_id=job_id,
                        overall_match=base_match_dec,
                        skill_match=final_skill,
                        experience_match=final_experience,
                        location_match=final_location,
                        salary_match=final_salary,
                        missing_skills=missing_skills,
                        matched_skills=matched_skills,
                        skill_gap_recommendations=skill_gap_recommendations,
                        analysis_notes=reasoning,
                        match_quality=quality,
                        model_version="ApplyVortex-AI-Scorer-v1",
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    ).on_conflict_do_update(
                        constraint="idx_job_match_analysis_unique",
                        set_={
                            'overall_match': base_match_dec,
                            'skill_match': final_skill,
                            'experience_match': final_experience,
                            'location_match': final_location,
                            'salary_match': final_salary,
                            'missing_skills': missing_skills,
                            'matched_skills': matched_skills,
                            'skill_gap_recommendations': skill_gap_recommendations,
                            'analysis_notes': reasoning,
                            'match_quality': quality,
                            'updated_at': datetime.utcnow()
                        }
                    )
                    await self.session.execute(match_stmt)
                
                except Exception as inner_e:
                    logger.error(f"Failed to upsert job index {i}: {inner_e}", exc_info=True)
                    raise inner_e 

            await self.session.commit()
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Failed to bulk upsert enriched jobs: {e}")
            raise
    
    async def get_multi(self, limit: int = 50, offset: int = 0) -> List[Job]:
        """Get multiple jobs with pagination."""
        from sqlalchemy.orm import selectinload
        
        query = select(Job).options(
            selectinload(Job.match_scores),
            selectinload(Job.user_job_maps)
        ).order_by(Job.created_at.desc()).limit(limit).offset(offset)
        
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def get_by_user_id(self, user_id: UUID) -> List[Job]:
        from sqlalchemy.orm import selectinload
        from app.models.job.user_job_map import UserJobMap
        
        query = select(Job).join(UserJobMap).where(
            UserJobMap.user_id == user_id
        ).options(
            selectinload(Job.match_scores),
            selectinload(Job.user_job_maps)
        ).order_by(UserJobMap.created_at.desc())
        
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def get_by_portal(self, user_id: UUID, portal: int) -> List[Job]:
        from sqlalchemy.orm import selectinload
        from app.models.job.user_job_map import UserJobMap
        
        query = select(Job).join(UserJobMap).where(
            UserJobMap.user_id == user_id,
            Job.portal == portal
        ).options(
            selectinload(Job.match_scores),
            selectinload(Job.user_job_maps)
        ).order_by(UserJobMap.created_at.desc())
        
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def update_status(self, user_id: UUID, job_id: UUID, status: int) -> bool:
        from app.models.job.user_job_map import UserJobMap
        
        stmt = select(UserJobMap).where(
            UserJobMap.user_id == user_id,
            UserJobMap.job_id == job_id
        )
        result = await self.session.execute(stmt)
        mapping = result.scalar_one_or_none()
        
        if mapping:
            mapping.application_status = status
            mapping.applied_at = datetime.utcnow() if status == "applied" else mapping.applied_at
            await self.session.commit()
            return True
        return False

    async def update_job_identifiers(self, job_id: UUID, job_post_url: Optional[str] = None, requisition_id: Optional[str] = None) -> bool:
        job = await self.get(job_id)
        if job:
            if job_post_url: job.job_post_url = job_post_url
            if requisition_id: job.requisition_id = requisition_id
            await self.session.commit()
            return True
        return False

    async def get_with_user_context(self, job_id: UUID, user_id: UUID) -> Optional[Job]:
        from sqlalchemy.orm import selectinload, contains_eager
        from app.models.job.user_job_map import UserJobMap
        
        query = select(Job).outerjoin(
            UserJobMap, 
            (UserJobMap.job_id == Job.id) & (UserJobMap.user_id == user_id)
        ).where(Job.id == job_id).options(
            selectinload(Job.match_scores),
            contains_eager(Job.user_job_maps)
        )
        
        result = await self.session.execute(query)
        return result.unique().scalar_one_or_none()

    async def get_jobs_with_user_context(self, user_id: UUID, limit: int = 50, offset: int = 0) -> List[Job]:
        """Get multiple jobs with user's application status"""
        from sqlalchemy.orm import selectinload, contains_eager
        from app.models.job.user_job_map import UserJobMap
        
        query = select(Job).outerjoin(
            UserJobMap, 
            (UserJobMap.job_id == Job.id) & (UserJobMap.user_id == user_id)
        ).options(
            selectinload(Job.match_scores),
            contains_eager(Job.user_job_maps)
        ).order_by(Job.created_at.desc()).limit(limit).offset(offset)
        
        result = await self.session.execute(query)
        return result.unique().scalars().all()

    async def get_jobs_since(self, user_id: UUID, since: datetime, limit: int = 50) -> List[Job]:
        """Get jobs saved by user since a specific datetime"""
        from sqlalchemy.orm import selectinload
        from app.models.job.user_job_map import UserJobMap
        
        query = select(Job).join(UserJobMap).where(
            UserJobMap.user_id == user_id,
            UserJobMap.created_at >= since
        ).options(
            selectinload(Job.match_scores),
            selectinload(Job.user_job_maps)
        ).order_by(UserJobMap.created_at.desc()).limit(limit)
        
        result = await self.session.execute(query)
        return result.scalars().all()

    async def count_jobs_since(self, user_id: UUID, since: datetime) -> int:
        """Count jobs saved by user since a specific datetime"""
        from sqlalchemy import func
        from app.models.job.user_job_map import UserJobMap
        
        query = select(func.count(UserJobMap.job_id)).where(
            UserJobMap.user_id == user_id,
            UserJobMap.created_at >= since
        )
        
        result = await self.session.execute(query)
        return result.scalar() or 0
