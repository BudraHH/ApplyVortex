from typing import List, Any
import logging
import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from uuid import UUID

from app.core.dependencies import (
    get_db,
    get_job_service,
    get_complete_profile_service
)
from app.api.api_key_auth import get_authenticated_user
from app.models.user.user import User
from app.services.job.job import JobService
from app.schemas.job.job import BulkJobCreate, BulkEnrichedJobCreate
from app.models.agent_forge_task import AgentForgeTask
from app.models.agent import Agent
from app.models.job.job_portal import JobPortal
from app.models.job.job_application import JobApplication
from app.schemas.agent_forge import AgentTaskResponse, AgentTaskResult
# from app.models.enums.job_enums import JobApplicationStatus -> Removed
# from app.models.enums.agent_enums import AgentTaskType -> Removed
from app.constants.constants import AgentTaskType, TaskStatus, ApplicationStatus as JobApplicationStatus, ResumeType, NotificationType, BlueprintStatus
from app.repositories.user.notification_repository import NotificationRepository
from app.models.job.user_preference_blueprint import UserBlueprint
from app.schemas.job.blueprint import BlueprintResponse
from app.models.job.job import Job
from app.models.job.user_job_map import UserJobMap

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/active-blueprints", response_model=List[BlueprintResponse])
async def get_active_blueprints(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_authenticated_user)
) -> Any:
    """Fetch all active blueprints for the authenticated user (Agent)."""
    from sqlalchemy import or_
    stmt = select(UserBlueprint).where(
        UserBlueprint.user_id == user.id,
        or_(
            UserBlueprint.is_active == True,
            UserBlueprint.status > 0 # ACTIVE (1=SCRAPE, 2=APPLY)
        )
    )
    result = await db.execute(stmt)
    blueprints = result.scalars().all()
    return blueprints

@router.get("/unapplied-jobs", response_model=Any)
async def get_unapplied_jobs(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_authenticated_user)
) -> Any:
    """
    Fetch jobs eligible for application.
    Returns jobs with status NOT_APPLIED (0) or FAILED (3).
    Excludes IN_PROGRESS (2) and APPLIED (1) jobs.
    """
    from app.constants.constants import ApplicationStatus
    
    stmt = select(UserJobMap).join(
        UserBlueprint, UserJobMap.blueprint_id == UserBlueprint.id
    ).where(
        UserJobMap.user_id == user.id,
        UserBlueprint.status == BlueprintStatus.AUTO_APPLY.value,  # Only auto-apply enabled blueprints
        UserJobMap.application_status.in_([
            ApplicationStatus.NOT_APPLIED,  # 0 - Fresh jobs
            ApplicationStatus.FAILED        # 3 - Failed jobs (allow retry)
        ])
    ).limit(limit)
    
    result = await db.execute(stmt)
    user_job_maps = result.scalars().all()

    # We need to return the JOB details, not just the map
    jobs_data = []
    from app.repositories.job.job_repository import JobRepository
    job_repo = JobRepository(db)
    
    for ujm in user_job_maps:
        # Get full job details
        job = await job_repo.get(ujm.job_id)
        if job:
            # Retrieve match score
            match_score = 0
            # Try to get match score from pre-loaded relationship (if available) or fetch it
            # We can use the repository to fetch specific match score
            from app.models.job.job_match import JobMatchAnalysis
            match_stmt = select(JobMatchAnalysis).where(
                JobMatchAnalysis.job_id == job.id,
                JobMatchAnalysis.user_id == user.id
            )
            match_res = await db.execute(match_stmt)
            match_obj = match_res.scalars().first()
            if match_obj:
                match_score = match_obj.overall_match

            jobs_data.append({
                "id": str(job.id),
                "title": job.title,
                "company": job.company_name,
                "job_url": job.job_post_url, # removed portal_url fallback as it might be invalid
                "description": job.description,
                "location": job.location_raw,
                "portal": job.portal,
                "match_score": match_score
            })
            
    return jobs_data

@router.post("/jobs/{job_id}/applied", status_code=status.HTTP_200_OK)
async def mark_job_as_applied(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_authenticated_user)
) -> Any:
    """Mark a job as applied by the agent."""
    stmt = select(UserJobMap).where(
        UserJobMap.user_id == user.id,
        UserJobMap.job_id == job_id
    )
    result = await db.execute(stmt)
    ujm = result.scalars().first()
    
    if ujm:
        ujm.application_status = JobApplicationStatus.APPLIED.value
        import datetime
        ujm.applied_at = datetime.datetime.now(datetime.timezone.utc)
        await db.commit()
        return {"message": "Job marked as applied"}
    
    return {"message": "Job map not found", "status": "failed"}

@router.post("/jobs/{job_id}/enrich", status_code=status.HTTP_200_OK)
async def enrich_job_detail(
    job_id: UUID,
    data: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_authenticated_user)
) -> Any:
    """
    Update job details using Structured Payload.
    Payload Structure:
    {
      "job_data": { ... },       # For 'jobs' table
      "user_status": { ... },    # For 'user_job_map' table
      "job_analysis": { ... }    # For 'job_match_analysis' table
    }
    """
    
    # --- 1. Update Global Job Table (from 'job_data') ---
    job_payload = data.get("job_data", {})
    if job_payload:
        job = await db.get(Job, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        import datetime
        # Only update provided fields
        if "description" in job_payload: job.description = job_payload["description"]
        if "requirements" in job_payload: job.requirements = job_payload["requirements"]
        if "responsibilities" in job_payload: job.responsibilities = job_payload["responsibilities"]
        if "seniority_level" in job_payload: job.seniority_level = job_payload["seniority_level"]
        
        # URL Logic
        if "job_post_url" in job_payload: job.job_post_url = job_payload["job_post_url"]
        elif "apply_url" in job_payload: job.job_post_url = job_payload["apply_url"]
        
        # Metadata
        job.deep_scraped_at = datetime.datetime.now(datetime.timezone.utc)
        
        # Easy Apply Logic
        if "is_easy_apply" in job_payload:
            from app.constants.constants import ApplicationMethod
            if job_payload["is_easy_apply"]:
                job.application_method = ApplicationMethod.EASY_APPLY.value
            elif job.application_method == ApplicationMethod.EASY_APPLY.value:
                job.application_method = ApplicationMethod.DIRECT_APPLY.value

    # --- 2. Update User Job Map (from 'user_status') ---
    status_payload = data.get("user_status", {})
    if status_payload:
        status_str = status_payload.get("status")
        
        from app.constants.constants import ApplicationStatus
        new_status = ApplicationStatus.NOT_APPLIED.value
        
        # Logic to map string status to Enum
        if status_str == "MATCHED":
            new_status = ApplicationStatus.NOT_APPLIED.value
        elif status_str == "AUTO_REJECTED" or status_str == "JUNK":
            new_status = ApplicationStatus.FAILED.value
        
        # Or explicit integer override
        if "application_status" in status_payload:
            new_status = status_payload["application_status"]
            
        # Update DB
        stmt = select(UserJobMap).where(
            UserJobMap.user_id == user.id,
            UserJobMap.job_id == job_id
        )
        res = await db.execute(stmt)
        ujm = res.scalars().first()
        if ujm:
            ujm.application_status = new_status

    # --- 3. Update Job Match Analysis (from 'job_analysis') ---
    analysis_payload = data.get("job_analysis", {})
    if analysis_payload and "match_score" in analysis_payload:
        from app.models.job.job_match import JobMatchAnalysis
        import datetime
        
        match_stmt = select(JobMatchAnalysis).where(
            JobMatchAnalysis.user_id == user.id,
            JobMatchAnalysis.job_id == job_id
        )
        match_res = await db.execute(match_stmt)
        match_obj = match_res.scalars().first()
        
        if not match_obj:
            match_obj = JobMatchAnalysis(
                user_id=user.id, 
                job_id=job_id,
                created_at=datetime.datetime.now(datetime.timezone.utc)
            )
            db.add(match_obj)
        
        match_obj.overall_match = analysis_payload.get("match_score")
        match_obj.analysis_notes = analysis_payload.get("reasoning") or analysis_payload.get("ai_reasoning")
        match_obj.missing_skills = analysis_payload.get("missing_skills", [])
        
        # Optional: Recommendations
        if "skill_gap_recommendations" in analysis_payload:
            match_obj.skill_gap_recommendations = analysis_payload["skill_gap_recommendations"]
            
        match_obj.updated_at = datetime.datetime.now(datetime.timezone.utc)

    await db.commit()
    logger.info(f"Job {job_id} enriched via nested payload.")
    return {"message": "Job enriched successfully"}


@router.post("/check-jobs-status", response_model=Any)
async def check_jobs_status(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_authenticated_user)
) -> Any:
    """
    Check if jobs exist and if they are already deep scraped.
    Payload: {"portal": "linkedin", "external_ids": ["123", "456"]}
    Returns: {"123": {"exists": true, "deep_scraped": true}, ...}
    """
    portal_slug = payload.get("portal", "linkedin").lower()
    external_ids = payload.get("external_ids", [])
    
    if not external_ids:
        return {}
        
    # Resolve Portal ID
    from app.constants.constants import Portal
    portal_id = Portal.LINKEDIN.value
    if "naukri" in portal_slug: portal_id = Portal.NAUKRI.value
    elif "indeed" in portal_slug: portal_id = Portal.INDEED.value
    elif "glassdoor" in portal_slug: portal_id = Portal.GLASSDOOR.value
    
    # Query Jobs
    stmt = select(Job).where(
        Job.portal == portal_id,
        Job.external_id.in_(external_ids)
    )
    result = await db.execute(stmt)
    existing_jobs = result.scalars().all()
    
    status_map = {}
    for job in existing_jobs:
        status_map[job.external_id] = {
            "exists": True,
            "deep_scraped": job.deep_scraped_at is not None
        }
    
    # Fill in missing (not found)
    for eid in external_ids:
        if eid not in status_map:
            status_map[eid] = {"exists": False, "deep_scraped": False}
            
    return status_map


@router.get("/full-profile", response_model=Any)
async def get_agent_user_full_profile(
    user: User = Depends(get_authenticated_user),
    complete_profile_service = Depends(get_complete_profile_service)
) -> Any:
    """
    Fetch the authenticated user's FULL aggregate profile for the Agent.
    Uses API Key authentication (via get_authenticated_user).
    """
    logging.info(f"Agent {user.id} requesting full profile via API Key")
    data = await complete_profile_service.get_complete_profile(user.id)
    return data


@router.get("/tasks/{task_id}", response_model=AgentTaskResponse)
async def get_task_by_id(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_authenticated_user)
) -> Any:
    """Fetch a specific task by ID."""
    task = await db.get(AgentForgeTask, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return task

@router.get("/tasks", response_model=List[AgentTaskResponse])
async def get_pending_task(
    agent_id: str = Query(None, description="Agent ID for task assignment"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_authenticated_user)
) -> Any:
    """
    Fetch the oldest PENDING task for the authenticated user and lock it.
    Update status to IN_PROGRESS.
    """
    logger.info(f"DEBUG TASK: Fetching tasks for user {user.id}, Agent ID: {agent_id}")
    
    # Find agent if agent_id provided
    agent = None
    if agent_id:
        stmt = select(Agent).where(
            Agent.agent_id == agent_id,
            Agent.user_id == user.id
        )
        result = await db.execute(stmt)
        agent = result.scalars().first()
        
        logger.info(f"DEBUG TASK: Agent found: {agent is not None}. Agent DB ID: {agent.id if agent else 'None'}")
        
        if agent:
            # Check rate limit
            from app.api.v1.endpoints.agents import check_rate_limit
            if not check_rate_limit(agent):
                logger.warning(f"DEBUG TASK: Rate limit exceeded for agent {agent.id}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Max {agent.max_tasks_per_hour} tasks/hour."
                )
    
    # Fetch oldest PENDING task
    if agent:
        stmt = select(AgentForgeTask).where(
            AgentForgeTask.user_id == user.id,
            AgentForgeTask.status == TaskStatus.PENDING.value,
            or_(
                AgentForgeTask.assigned_agent_id == str(agent.id),  # Cast to string if needed
                AgentForgeTask.assigned_agent_id == None
            )
        ).order_by(AgentForgeTask.created_at.asc()).limit(1).with_for_update()
    else:
        stmt = select(AgentForgeTask).where(
            AgentForgeTask.user_id == user.id,
            AgentForgeTask.status == TaskStatus.PENDING.value
        ).order_by(AgentForgeTask.created_at.asc()).limit(1).with_for_update()
    
    result = await db.execute(stmt)
    tasks = result.scalars().all()
    logger.info(f"DEBUG TASK: Found {len(tasks)} pending tasks for user {user.id}")
    
    if not tasks:
        return []

    task = tasks[0]
    task.status = TaskStatus.IN_PROGRESS.value
    
    if agent:
        task.assigned_agent_id = agent.id
        agent.total_tasks_assigned += 1
        agent.tasks_this_hour += 1
    
    await db.commit()
    await db.refresh(task)
    
    return [task]

@router.get("/full-profile", response_model=Any)
async def get_agent_user_full_profile(
    user: User = Depends(get_authenticated_user),
    complete_profile_service = Depends(get_complete_profile_service)
) -> Any:
    """
    Fetch the authenticated user's FULL aggregate profile for the Agent.
    Uses API Key authentication.
    """
    data = await complete_profile_service.get_complete_profile(user.id)
    return data

@router.post("/results/{task_id}", status_code=status.HTTP_200_OK)
async def submit_task_result(
    task_id: str,
    result_in: AgentTaskResult,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_authenticated_user),
    complete_profile_service = Depends(get_complete_profile_service)
) -> Any:
    """Submit the result of a task."""
    task = await db.get(AgentForgeTask, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if task.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    task.status = result_in.status if result_in.status else TaskStatus.COMPLETED.value
    task.result = result_in.result_data
    task.error_log = result_in.error_log
    
    if task.task_type == AgentTaskType.APPLY and task.payload:
        app_id = task.payload.get("application_id")
        if app_id:
            application = await db.get(JobApplication, app_id)
            if application:
                if task.status == TaskStatus.COMPLETED:
                    application.status = JobApplicationStatus.APPLIED
                    application.automation_status = "completed"
                    application.response_received = True
                    if task.result and "details" in task.result:
                        details = task.result.get("details", {})
                        if "screenshots" in details:
                            application.screenshots = details.get("screenshots")
                    if not application.applied_at:
                        from datetime import datetime, timezone
                        application.applied_at = datetime.now(timezone.utc)
                elif task.status == TaskStatus.FAILED:
                    application.automation_status = "failed"
                    application.error_message = task.error_log or "Agent reported failure"
    
    # NEW: Handle Deep Scrape Result
    print(f"DEBUG: Checking Deep Scrape Logic for Task {task.id}")
    print(f"DEBUG: task_type={task.task_type} (Expected {AgentTaskType.SCRAPE.value})")
    print(f"DEBUG: payload={task.payload}")
    
    if (task.task_type == AgentTaskType.DEEP_SCRAPE or task.task_type == AgentTaskType.SCRAPE.value or task.task_type == AgentTaskType.AUTO_APPLY.value) and task.payload and (task.payload.get("action") == "deep_scrape" or task.task_type == AgentTaskType.DEEP_SCRAPE):
        print("DEBUG: Condition Met! Entering Deep Scrape Block")
        job_id = task.payload.get("job_id")
        print(f"DEBUG: job_id from payload={job_id}")
        
        if job_id and task.status == TaskStatus.COMPLETED.value:
            from datetime import datetime
            try:
                # job_id might be a string or UUID in payload
                from uuid import UUID
                jid = UUID(str(job_id))
                print(f"DEBUG: Resolved Job ID: {jid}")
                job = await db.get(Job, jid)
                if job:
                    print(f"DEBUG: Job Found: {job.title}")
                    enriched_data = task.result.get("enriched_data", {}) if task.result else {}
                    print(f"DEBUG: Enriched Data Keys: {list(enriched_data.keys())}")
                    
                    if enriched_data:
                        job.description = enriched_data.get("description", job.description)
                        job.requirements = enriched_data.get("requirements", job.requirements)
                        job.responsibilities = enriched_data.get("responsibilities", job.responsibilities)
                        # --- Deep Scrape Enrichment Logic ---
                        from app.constants.constants import ApplicationMethod, WorkMode, JobType
                        
                        # 1. Map Application Method & URL
                        # The scraper sends 'is_easy_apply' boolean and 'apply_url' string
                        is_easy = enriched_data.get("is_easy_apply", False)
                        scraped_url = enriched_data.get("apply_url")
                        
                        if is_easy:
                            job.application_method = ApplicationMethod.EASY_APPLY.value
                            # Ideally, easy apply uses the internal LinkedIn URL or job post URL
                            # We don't overwrite external_apply_url
                        else:
                            job.application_method = ApplicationMethod.DIRECT_APPLY.value
                            if scraped_url and scraped_url != job.job_post_url:
                                job.external_apply_url = scraped_url

                        # 2. Parse Work Mode
                        w_mode = enriched_data.get("workplace_type")
                        if w_mode:
                            w_lower = w_mode.lower()
                            if "remote" in w_lower: job.work_mode = WorkMode.REMOTE.value
                            elif "hybrid" in w_lower: job.work_mode = WorkMode.HYBRID.value
                            elif "on-site" in w_lower or "onsite" in w_lower: job.work_mode = WorkMode.ONSITE.value
                        
                        # 3. Parse Job Type
                        j_type = enriched_data.get("job_type")
                        if j_type:
                            j_lower = j_type.lower()
                            if "full" in j_lower: job.job_type = JobType.FULL_TIME.value
                            elif "part" in j_lower: job.job_type = JobType.PART_TIME.value
                            elif "contract" in j_lower: job.job_type = JobType.CONTRACT.value
                            elif "intern" in j_lower: job.job_type = JobType.INTERNSHIP.value
                            elif "freelance" in j_lower: job.job_type = JobType.FREELANCE.value

                        # 4. Seniority & Applicants
                        job.seniority_level = enriched_data.get("seniority_level", job.seniority_level)
                        job.applicants = enriched_data.get("applicants", job.applicants)
                        
                        # 5. Parse Posted Date
                        p_date_str = enriched_data.get("posted_date")
                        if p_date_str:
                            try:
                                from datetime import timedelta
                                now = datetime.utcnow()
                                p_lower = p_date_str.lower()
                                
                                delta = timedelta(seconds=0)
                                if "hour" in p_lower or "minute" in p_lower or "just" in p_lower:
                                    pass # roughly now
                                elif "day" in p_lower:
                                    # Extract number
                                    import re
                                    nums = re.findall(r'\d+', p_lower)
                                    if nums: delta = timedelta(days=int(nums[0]))
                                elif "week" in p_lower:
                                    nums = re.findall(r'\d+', p_lower)
                                    if nums: delta = timedelta(weeks=int(nums[0]))
                                
                                job.posted_at = now - delta
                            except Exception as e:
                                logger.warning(f"Failed to parse posted date '{p_date_str}': {e}")
                            
                        job.job_post_url = enriched_data.get("job_post_url", enriched_data.get("apply_url", job.job_post_url))
                        job.deep_scraped_at = datetime.utcnow()
                        print(f"DEBUG: Updated Job {job_id} (deep_scraped_at set)")
                        logger.info(f"submit_task_result: Updated Job {job_id} with deep scraped data")
                    else:
                        print("DEBUG: No enriched_data in task result")
                else:
                    print(f"DEBUG: Job {jid} not found in DB")
            except Exception as e:
                import traceback
                traceback.print_exc()
                logger.error(f"submit_task_result: Failed to update job with deep scrape data: {e}")
        else:
            print(f"DEBUG: JobID missing or Status not COMPLETED ({task.status})")
    else:
        print("DEBUG: Condition NOT Met")
    
    # --- NEW: Handle Resume Parsing Completion (Sync to Profile) ---
    print(f"DEBUG SYNC: Task {task.id} type={task.task_type}, status={task.status}")
    if (task.task_type == AgentTaskType.PARSE_RESUME or task.task_type == 0) and task.status == TaskStatus.COMPLETED:
        try:
            raw_data = result_in.result_data
            if raw_data:
                print(f"Syncing Parsed Resume Data for User {current_user.id}...")
                
                # 1. Transform Agent Data -> Server Schema
                transformed_data = {}
                
                def parse_date_parts(date_str):
                    """Parse date string to (month, year) tuple. Returns (None, None) if invalid/missing."""
                    if not date_str:
                        return None, None  # No fallback - return None for missing dates
                    try:
                        # Handle YYYY-MM-DD or YYYY-MM
                        parts = date_str.split('-')
                        if len(parts) >= 1:
                            year = int(parts[0])
                            month = int(parts[1]) if len(parts) > 1 else 1
                            return month, year
                    except:
                        pass
                    return None, None  # Return None on parse error instead of fallback
                
                def clean_location_field(value):
                    """Convert empty strings to None for location fields."""
                    if value is None or (isinstance(value, str) and value.strip() == ""):
                        return None
                    return value

                # A. Profile / Personal Information
                p_details = raw_data.get("personal_details", {})
                if p_details:
                    # Enhanced Phone Parsing (Handles +917397509844, +91 7397509844, 7397509844)
                    raw_phone = p_details.get("phone", "")
                    clean_digits = "".join(filter(str.isdigit, raw_phone))
                    
                    phone_val = clean_digits
                    country_code = "+91" # Default
                    
                    if len(clean_digits) > 10:
                        if clean_digits.startswith("91"):
                            # India with country code
                            phone_val = clean_digits[2:]
                            country_code = "+91"
                        else:
                            # International or other country code
                            phone_val = clean_digits[-10:]
                            country_code = "+" + clean_digits[:-10]
                    else:
                        # 10 digits or less, keep as is and use default +91
                        phone_val = clean_digits
                        country_code = "+91"
                    
                    # Final cleanup: Remove leading zero if present in 11-digit local format
                    if len(phone_val) == 11 and phone_val.startswith("0"):
                        phone_val = phone_val[1:]
                    
                    # Custom Name Parsing Logic
                    # Extract raw name components from AI
                    raw_first = p_details.get("first_name", "User").strip()
                    raw_middle = p_details.get("middle_name", "").strip()
                    raw_last = p_details.get("last_name", "").strip()
                    
                    logger.info(f"[NAME PARSE] Raw from AI -> First: '{raw_first}', Middle: '{raw_middle}', Last: '{raw_last}'")
                    
                    first_name = raw_first
                    middle_name = raw_middle
                    last_name = raw_last
                    
                    # If AI didn't split properly, implement custom logic
                    if not middle_name and first_name and last_name:
                        first_parts = first_name.split()
                        last_parts = last_name.split()
                        
                        if len(first_parts) > 1:
                            first_name = first_parts[0]
                            middle_name = " ".join(first_parts[1:])
                            logger.info(f"[NAME PARSE] Rule 1 triggered (Multi-word First Name) -> First: '{first_name}', Middle: '{middle_name}'")
                        elif len(last_parts) > 1 and len(last_parts[-1]) == 1:
                            last_name = last_parts[-1]
                            middle_name = " ".join(last_parts[:-1])
                            logger.info(f"[NAME PARSE] Rule 2 triggered (Initial Last Name) -> Middle: '{middle_name}', Last: '{last_name}'")
                    
                    logger.info(f"[NAME PARSE] Final Result -> First: '{first_name}', Middle: '{middle_name}', Last: '{last_name}'")
                    
                    transformed_data["profile"] = {
                        "gender": 4, # Gender.PREFER_NOT_TO_SAY
                        "first_name": first_name or "User",
                        "middle_name": middle_name or None,
                        "last_name": last_name or "",
                        "phone_number": phone_val or "0000000000",
                        "phone_country_code": country_code,
                        "professional_summary": p_details.get("professional_summary") or p_details.get("summary"),
                        "linkedin_url": p_details.get("linkedin_url"),
                        "github_url": p_details.get("github_url"),
                        "portfolio_url": p_details.get("portfolio_url"),
                        "current_city": clean_location_field(p_details.get("location", {}).get("city")) if isinstance(p_details.get("location"), dict) else None,
                        "current_state": clean_location_field(p_details.get("location", {}).get("state")) if isinstance(p_details.get("location"), dict) else None,
                        "current_country": clean_location_field(p_details.get("location", {}).get("country")) if isinstance(p_details.get("location"), dict) else None,
                        "headline": p_details.get("job_title") or "Professional"
                    }
                
                # B. Experience
                if "experience" in raw_data:
                    transformed_data["experiences"] = []
                    for exp in raw_data["experience"]:
                         sm, sy = parse_date_parts(exp.get("start_date"))
                         em, ey = parse_date_parts(exp.get("end_date")) if exp.get("end_date") else (None, None)
                         
                         # Extract skills for this experience
                         exp_skills = []
                         skills_raw = exp.get("skills_used") or exp.get("skills") or exp.get("technologies") or []
                         if skills_raw:
                             for skill in skills_raw:
                                 if isinstance(skill, str):
                                     exp_skills.append({"name": skill})
                                 elif isinstance(skill, dict) and skill.get("name"):
                                     exp_skills.append({"name": skill["name"]})
                         
                         transformed_data["experiences"].append({
                             "company_name": exp.get("company", "Unknown Company"),
                             "job_title": exp.get("title", "Unknown Role"),
                             "start_month": sm,
                             "start_year": sy,
                             "end_month": em,
                             "end_year": ey,
                             "is_current": exp.get("current", False),
                             "job_summary": exp.get("description") if isinstance(exp.get("description"), str) else "\n".join(str(item) for item in exp.get("description", [])),
                             "achievements": exp.get("achievements"),
                             "employment_type": 1, # Default Full-time
                             "city": clean_location_field(exp.get("location", {}).get("city")) if isinstance(exp.get("location"), dict) else None,
                             "state": clean_location_field(exp.get("location", {}).get("state")) if isinstance(exp.get("location"), dict) else None,
                             "country": clean_location_field(exp.get("location", {}).get("country")) if isinstance(exp.get("location"), dict) else None,
                             "skills": exp_skills if exp_skills else None
                         })

                # C. Education
                if "education" in raw_data:
                    transformed_data["educations"] = []
                    for edu in raw_data["education"]:
                         sm, sy = parse_date_parts(edu.get("start_date"))
                         em, ey = parse_date_parts(edu.get("end_date")) if edu.get("end_date") else (None, None)
                         
                         # Map grade type string to integer
                         grade_type_int = None
                         grade_type_str = (edu.get("grade_type") or "").lower()
                         if "percentage" in grade_type_str or "%" in grade_type_str:
                             grade_type_int = 1  # GradeType.PERCENTAGE
                         elif "cgpa" in grade_type_str:
                             grade_type_int = 2  # GradeType.CGPA
                         elif "gpa" in grade_type_str:
                             grade_type_int = 3  # GradeType.GPA
                         elif "grade" in grade_type_str or "letter" in grade_type_str:
                             grade_type_int = 4  # GradeType.GRADE
                         else:
                             grade_type_int = 9  # GradeType.NOT_APPLICABLE (default)
                         
                         edu_item = {
                             "institution_name": edu.get("institution", "Unknown Institution"),
                             "university_name": edu.get("university"),
                             "degree_name": edu.get("degree", "Degree"),
                             "degree_type": 5, # Default Undergraduate
                             "field_of_study": edu.get("field_of_study", "General"),
                             "start_month": sm,
                             "start_year": sy,
                             "end_month": em,
                             "end_year": ey,
                             "city": clean_location_field(edu.get("location", {}).get("city")) if isinstance(edu.get("location"), dict) else None,
                             "state": clean_location_field(edu.get("location", {}).get("state")) if isinstance(edu.get("location"), dict) else None,
                             "country": clean_location_field(edu.get("location", {}).get("country")) if isinstance(edu.get("location"), dict) else None,
                             "grade_value": edu.get("gpa"),
                             "grade_type": grade_type_int,
                             "description": edu.get("description"),
                             "relevant_coursework": edu.get("relevant_coursework"),
                             "thesis_title": edu.get("thesis_title"),
                             "thesis_description": edu.get("thesis_description"),
                             "research_areas": edu.get("research_areas"),
                             "publications": edu.get("publications")

                         }
                         print(f"DEBUG EDU ITEM: {edu_item}")
                         transformed_data["educations"].append(edu_item)
                
                # D. Projects
                if "projects" in raw_data:
                    transformed_data["projects"] = []
                    for proj in raw_data["projects"]:
                         # Prioritize start_date/end_date from new prompt
                         psm, psy = parse_date_parts(proj.get("start_date") or proj.get("date"))
                         pem, pey = parse_date_parts(proj.get("end_date")) if proj.get("end_date") else (None, None)
                         
                         transformed_data["projects"].append({
                             "project_name": proj.get("name", "Project"),
                             "short_description": proj.get("short_description"),
                             "detailed_description": proj.get("description") if isinstance(proj.get("description"), str) else "\n".join(str(item) for item in proj.get("description", [])),
                             "live_url": proj.get("url") or proj.get("live_url"),
                             "github_url": proj.get("github_url"),
                             "start_month": psm,
                             "start_year": psy,
                             "end_month": pem,
                             "end_year": pey,
                             "is_ongoing": proj.get("is_ongoing", False),
                             "skills": [{"name": s} if isinstance(s, str) else s for s in (proj.get("skills_used") or proj.get("technologies_used") or proj.get("technologies") or proj.get("skills") or [])]
                         })
                         
                # E. Skills
                if "skills" in raw_data:
                    transformed_data["skills"] = []
                    for skill_name in raw_data["skills"]:
                        if isinstance(skill_name, str):
                            transformed_data["skills"].append({
                                "name": skill_name, 
                                "category": 99, 
                                "proficiency": 4 
                            })

                # F. Languages
                if "languages" in raw_data:
                    transformed_data["languages"] = []
                    for lang in raw_data["languages"]:
                         if isinstance(lang, str):
                            transformed_data["languages"].append({
                                "language": lang, 
                                "proficiency": 3 
                            })
                
                # G. Certifications
                if "certifications" in raw_data:
                    transformed_data["certifications"] = []
                    for cert in raw_data["certifications"]:
                         # Convert date string to date object for Pydantic
                         cert_date = None
                         try:
                             if cert.get("date"):
                                 from datetime import datetime, date
                                 # Try YYYY-MM
                                 parts = cert.get("date").split('-')
                                 if len(parts) == 1:
                                     cert_date = date(int(parts[0]), 1, 1)
                                 elif len(parts) >= 2:
                                     cert_date = date(int(parts[0]), int(parts[1]), 1)
                         except:
                             pass

                         transformed_data["certifications"].append({
                             "name": cert.get("name", "Certification"),
                             "issuing_organization": cert.get("issuer", "Unknown"),
                             "issue_date": cert_date,
                             "credential_url": cert.get("url")
                         })
                
                # H. Research
                if "research" in raw_data:
                    transformed_data["research"] = []
                    for res in raw_data["research"]:
                        rpm, rpy = parse_date_parts(res.get("publication_date"))
                        transformed_data["research"].append({
                            "title": res.get("title", "Research Title"),
                            "authors": res.get("authors", "Author"),
                            "publisher": res.get("publisher", "Publisher"),
                            "publication_month": rpm,
                            "publication_year": rpy,
                            "url": res.get("url"),
                            "abstract": res.get("abstract", "Abstract text here...")
                        })
                
                # I. Accomplishments
                if "accomplishments" in raw_data:
                    transformed_data["accomplishments"] = []
                    for acc in raw_data["accomplishments"]:
                        transformed_data["accomplishments"].append({
                            "title": acc.get("title", "Accomplishment"),
                            "description": acc.get("description"),
                            "category": 1 # Default General
                        })
                
                # 2. Call Bulk Import
                import_result = await complete_profile_service.bulk_import_profile(current_user.id, transformed_data)
                print(f"DEBUG IMPORT RESULT: {import_result}")
                
                print(f"Resume Sync Completed for User {current_user.id}")
                task.result["sync_status"] = "success"
                
                # 3. Update Resume Status to SUCCESS
                if task.payload and task.payload.get("resume_id"):
                    from app.models.user.resume import UserResume
                    from app.constants.constants import ParsingStatus
                    from datetime import datetime, timezone
                    
                    resume_id = task.payload.get("resume_id")
                    resume = await db.get(UserResume, resume_id)
                    if resume:
                        resume.parsing_status = ParsingStatus.SUCCESS.value
                        resume.parsing_completed_at = datetime.now(timezone.utc)
                        resume.parsed_data = raw_data
                        print(f"✅ Updated resume {resume_id} status to SUCCESS")

                        # Send Notification
                        notif_repo = NotificationRepository(db)
                        await notif_repo.create_notification(
                            user_id=current_user.id,
                            type=NotificationType.SYSTEM.value,
                            title="Resume Parsed",
                            message="Your resume has been successfully parsed and your profile has been updated with the extracted information.",
                            action_url="/profile-setup",
                            metadata={"source": "agent_parsing", "resume_id": str(resume_id)}
                        )
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Failed to sync parsed resume data: {e}")
            # Don't fail the task itself, just log the sync error
            task.error_log = f"Sync Error: {str(e)}"
            
            # Update resume status to FAILED if we have resume_id
            if task.payload and task.payload.get("resume_id"):
                from app.models.user.resume import UserResume
                from app.constants.constants import ParsingStatus
                
                resume_id = task.payload.get("resume_id")
                resume = await db.get(UserResume, resume_id)
                if resume:
                    resume.parsing_status = ParsingStatus.FAILED.value
                    resume.parsing_error = str(e)

    await db.commit()
    return {"message": "Result received"}

@router.post("/results/{task_id}/jobs", status_code=status.HTTP_200_OK)
async def submit_partial_jobs(
    task_id: str,
    data: BulkEnrichedJobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_authenticated_user),
    job_service: JobService = Depends(get_job_service),
    complete_profile_service = Depends(get_complete_profile_service)
) -> Any:
    """Stream partial job results from a running scraping task with AI scoring."""
    try:
        logger.info(f"submit_partial_jobs: STARTED for task_id={task_id}")
        
        user_id = current_user.id
        logger.info(f"submit_partial_jobs: Identified user_id={user_id}")
        
        logger.info(f"submit_partial_jobs: Fetching AgentForgeTask with id={task_id}")
        task = await db.get(AgentForgeTask, task_id)
        
        if not task:
            logger.error(f"submit_partial_jobs: Task {task_id} not found")
            raise HTTPException(status_code=404, detail="Task not found")
        logger.info(f"submit_partial_jobs: Task {task_id} found")
            
        if task.user_id != user_id:
            logger.error(f"submit_partial_jobs: Authorization failed. Task user_id={task.user_id}, Current user_id={user_id}")
            raise HTTPException(status_code=403, detail="Not authorized")
        logger.info(f"submit_partial_jobs: Authorization successful")
        
        if not data.jobs:
            logger.info("submit_partial_jobs: No jobs provided in request payload")
            return {"message": "No jobs to process"}
        logger.info(f"submit_partial_jobs: Received {len(data.jobs)} jobs to persist from Agent.")

        # Prepare for persistence
        enriched_jobs = [job.model_dump() for job in data.jobs]

        # Stage 3: Filtering & Persistence
        logger.info("submit_partial_jobs: Stage 3 - Filtering & Persistence")
        
        try:
            filtered_jobs = enriched_jobs 
            dropped_count = 0
            logger.info(f"submit_partial_jobs: Filter disabled. Processing all {len(filtered_jobs)} enriched jobs")

            if filtered_jobs:
                # ========================================
                # AUTO DEEP SCRAPING: Identify top matches BEFORE persistence
                # Why? Because bulk_upsert_enriched pops match_score from the dicts
                # ========================================
                try:
                    # User Request: Agent now handles deep scraping directly during discovery.
                    # We no longer need to queue background tasks here.
                    logger.info("submit_partial_jobs: Skipping automatic deep scrape queueing (Agent-side enrichment active)")
                    top_jobs_to_scrape = []
                    
                except Exception as e:
                    logger.error(f"submit_partial_jobs: Initial deep scrape queueing logic failed: {e}")
                    top_jobs_to_scrape = []

                # Now persist the jobs
                logger.info(f"submit_partial_jobs: Calling job_service.bulk_upsert_enriched for {len(filtered_jobs)} jobs")
                await job_service.bulk_upsert_enriched(user_id, filtered_jobs)
                
                # IMPORTANT: We must commit BEFORE triggering background tasks 
                # or searching for newly created jobs in the database.
                await db.commit()
                logger.info(f"submit_partial_jobs: Transaction committed for task {task_id}")
                
                # Prepare response
                response = {
                    "message": f"Processed {len(enriched_jobs)} jobs. Saved {len(filtered_jobs)}. Filtered {dropped_count}.", 
                    "task_id": task_id,
                    "jobs_saved": len(filtered_jobs),
                    "jobs_filtered": dropped_count
                }

                # Now trigger the queued tasks (jobs are now committed in DB)
                if top_jobs_to_scrape:
                    try:
                        from app.tasks.scraping_tasks import deep_scrape_job_task
                        queued_count = 0
                        from app.constants.constants import Portal
                        
                        for job_data in top_jobs_to_scrape:
                            try:
                                # Resolve portal ID if it's a slug
                                portal_id = job_data.get('portal')
                                if isinstance(portal_id, str):
                                    p_lower = portal_id.lower()
                                    if "linkedin" in p_lower: portal_id = Portal.LINKEDIN.value
                                    elif "naukri" in p_lower: portal_id = Portal.NAUKRI.value
                                    else: portal_id = Portal.LINKEDIN.value # Default
                                elif portal_id is None:
                                    portal_id = Portal.LINKEDIN.value

                                logger.warning(f"ZZZ_LOOKUP: ext_id={job_data.get('external_id')}, portal={portal_id}")
                                
                                # Find job in database by external_id
                                stmt = select(Job).where(
                                    Job.external_id == str(job_data.get('external_id')),
                                    Job.portal == portal_id
                                )
                                result = await db.execute(stmt)
                                job = result.scalars().first()
                                
                                if job:
                                    if not job.deep_scraped_at:
                                        deep_scrape_job_task.delay(str(job.id), str(user_id))
                                        queued_count += 1
                                        logger.info(f"submit_partial_jobs: [AUTO-QUEUED] Deep scrape for job {job.id} ({job.title})")
                                    else:
                                        logger.info(f"submit_partial_jobs: Skipping job {job.id}, already deep scraped")
                                else:
                                    logger.warning(f"submit_partial_jobs: Job {job_data.get('external_id')} not found in DB after commit!")
                            except Exception as e:
                                logger.warning(f"submit_partial_jobs: Failed to queue deep scrape for {job_data.get('external_id')}: {e}")
                                continue
                        
                        logger.info(f"submit_partial_jobs: Successfully queued {queued_count} jobs for automatic deep scraping")
                        response["deep_scraping_queued"] = queued_count
                    except Exception as e:
                        logger.error(f"submit_partial_jobs: Failed to trigger deep scraping tasks: {e}")
                else:
                    logger.info("submit_partial_jobs: No jobs qualified for automatic deep scraping")
                    response["deep_scraping_queued"] = 0
            else:
                logger.info("submit_partial_jobs: No jobs to save after filtering")
                response = {"message": "No jobs to save", "jobs_saved": 0}
            
            return response
            
        except Exception as e:
            logger.error(f"submit_partial_jobs: Persistence failed for enriched jobs: {e}", exc_info=True)
            logger.info("submit_partial_jobs: Rolling back transaction due to persistence error")
            await db.rollback() 
            
            logger.info("submit_partial_jobs: Fallback - Attempting to bulk upsert raw jobs without scoring")
            await job_service.bulk_upsert(user_id, data)
            logger.info("submit_partial_jobs: Fallback upsert completed")
            
            return {
                "message": "Enriched persistence failed, saved jobs without scores",
                "error_type": "persistence_error",
                "error_detail": str(e),
                "jobs_saved": len(data.jobs)
            }
    except Exception as outer_e:
        logger.critical(f"submit_partial_jobs: Unhandled CRITICAL failure: {outer_e}", exc_info=True)
        raise

@router.get("/blueprints/{portal_name}", response_model=Any)
async def get_blueprint(
    portal_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_authenticated_user)
) -> Any:
    """Return the active JobPortal configuration."""
    stmt = select(JobPortal).where(JobPortal.name == portal_name, JobPortal.is_active == True)
    result = await db.execute(stmt)
    blueprint = result.scalars().first()
    
    if not blueprint:
        stmt = select(JobPortal).where(JobPortal.slug == portal_name, JobPortal.is_active == True)
        result = await db.execute(stmt)
        blueprint = result.scalars().first()
        
    if not blueprint:
        raise HTTPException(status_code=404, detail="Blueprint not found")
        
    return blueprint

@router.get("/history", response_model=List[AgentTaskResponse])
async def get_task_history(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_authenticated_user)
) -> Any:
    """Get task history."""
    stmt = select(AgentForgeTask).where(AgentForgeTask.user_id == current_user.id).order_by(AgentForgeTask.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    tasks = result.scalars().all()
    return tasks

@router.get("/resume", response_model=Any)
async def get_user_resume(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_authenticated_user)
) -> Any:
    """Get the user's base resume."""
    from app.models.user.resume import UserResume
    stmt = select(UserResume).where(UserResume.user_id == current_user.id, UserResume.resume_type == ResumeType.BASE.value).order_by(UserResume.created_at.desc()).limit(1)
    result = await db.execute(stmt)
    resume = result.scalars().first()
    
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No resume found")
    
    return {
        "id": str(resume.id),
        "file_name": resume.file_name,
        "file_url": resume.file_url,
        "created_at": resume.created_at
    }
