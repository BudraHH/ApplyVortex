from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
from app.core.dependencies import (
    get_db,
    get_current_user,
    get_user_service,
    get_profile_service,
    get_experience_service,
    get_project_service,
    get_education_service,
    get_certification_service,
    get_resume_service,
    get_language_service,
    get_user_skill_service,
    get_job_service,
    get_application_service,

    get_dashboard_service,
)
from app.services.dashboard.dashboard_service import DashboardService
from app.models.user.user import User

router = APIRouter()

@router.get("/", response_model=Dict[str, Any])
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    user_service=Depends(get_user_service),
    profile_service=Depends(get_profile_service),
    experience_service=Depends(get_experience_service),
    project_service=Depends(get_project_service),
    education_service=Depends(get_education_service),
    certification_service=Depends(get_certification_service),
    resume_service=Depends(get_resume_service),
    language_service=Depends(get_language_service),
    user_skill_service=Depends(get_user_skill_service),
    job_service=Depends(get_job_service),
    application_service=Depends(get_application_service)
):
    """
    Complete dashboard overview:
    - Profile completeness + sections
    - Recent activity (scrapes, applications)
    - Application pipeline stats
    - Saved jobs (top 5)
    - Calendar events (interviews, deadlines)
    - Quick actions (AI recommendations)
    """
    dashboard_service = DashboardService(
        db=db,
        user_service=user_service,
        profile_service=profile_service,
        experience_service=experience_service,
        project_service=project_service,
        education_service=education_service,
        certification_service=certification_service,
        resume_service=resume_service,
        language_service=language_service,
        user_skill_service=user_skill_service,
        job_service=job_service,
        application_service=application_service
    )
    return await dashboard_service.get_dashboard_data(current_user.id)

@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    dashboard_service=Depends(get_dashboard_service)
):
    """Lightweight stats only (for widgets/navbar)"""
    data = await dashboard_service.get_dashboard_data(current_user.id)
    return {
        "profile_completeness": data.get("profile", {}).get("completeness", 0),
        "saved_jobs": len(data.get("saved_jobs", [])),
        "applications_pipeline": data.get("applications", {}).get("pipeline", {}),
        "recent_activity_count": len(data.get("recent_activity", [])),
        "next_interview": data.get("calendar", {}).get("next_interview")
    }

@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = 10,
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    dashboard_service=Depends(get_dashboard_service)
):
    """Recent activity feed (infinite scroll)"""
    return await dashboard_service.get_recent_activity(current_user.id, limit=limit, days=days)

@router.get("/overview")
async def get_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    dashboard_service=Depends(get_dashboard_service)
):
    """
    Optimized overview stats + priority discoveries.
    Returns jobs found and auto-applications from the last 24 hours only.
    Uses 3 DB queries instead of 12+ for better performance.
    """
    return await dashboard_service.get_overview_data(current_user.id)

@router.get("/analytics")
async def get_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    dashboard_service=Depends(get_dashboard_service)
):
    """
    Analytics data: Activity heatmap + Market share distribution.
    
    Returns:
    - heatmapData: Jobs discovered per day for last 14 days
    - marketShare: Distribution of jobs by source portal
    """
    return await dashboard_service.get_analytics_data(current_user.id)

