from typing import Dict, Any, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from sqlalchemy import desc, and_

from app.services.user.user import UserService
from app.services.profile.profile_service import ProfileService
from app.services.profile import (
    ExperienceService, ProjectService, EducationService,
    CertificationService, ResumeService, LanguageService
)
from app.services.skills.user_skill import UserSkillService
from app.services.job.job import JobService
from app.services.job.application import ApplicationService

from app.repositories.activity.activity_repository import ActivityRepository  # New!
from app.models.activity.activity import Activity
from app.models.job.job_application import JobApplication
from app.models.job.job import Job
from app.models.user.experience import UserExperience


class DashboardService:
    def __init__(
        self,
        db: AsyncSession,
        user_service: UserService = None,
        profile_service: ProfileService = None,
        experience_service: ExperienceService = None,
        project_service: ProjectService = None,
        education_service: EducationService = None,
        certification_service: CertificationService = None,
        resume_service: ResumeService = None,
        language_service: LanguageService = None,
        user_skill_service: UserSkillService = None,
        job_service: JobService = None,
        application_service: ApplicationService = None,
        activity_repo: ActivityRepository = None
    ):
        self.db = db
        self.user_service = user_service
        self.profile_service = profile_service
        self.experience_service = experience_service
        self.project_service = project_service
        self.education_service = education_service
        self.certification_service = certification_service
        self.resume_service = resume_service
        self.language_service = language_service
        self.user_skill_service = user_skill_service
        self.job_service = job_service
        self.application_service = application_service

        self.activity_repo = activity_repo or ActivityRepository(db)
    
    async def get_overview_data(self, user_id: UUID) -> Dict[str, Any]:
        """
        Optimized overview stats for the dashboard hero section.
        Only fetches what's needed (3 queries instead of 12+).
        Returns jobs found + applications made in the last 24 hours.
        """
        from app.repositories.job.job_repository import JobRepository
        from app.repositories.job.application_repository import ApplicationRepository
        from app.schemas.job.job import JobResponse
        
        # Calculate 24-hour cutoff
        now = datetime.utcnow()
        since_24h = now - timedelta(hours=24)
        
        # Initialize repos directly for optimized queries
        job_repo = JobRepository(self.db)
        app_repo = ApplicationRepository(self.db)
        
        # Query 1: Get jobs saved in last 24 hours (with limit for priority discoveries)
        jobs_24h = await job_repo.get_jobs_since(user_id, since_24h, limit=10)
        
        # Query 2: Count jobs saved in last 24 hours (for accurate count)
        jobs_count_24h = await job_repo.count_jobs_since(user_id, since_24h)
        
        # Query 3: Count auto-applications in last 24 hours
        applications_24h = await app_repo.count_applied_since(user_id, since_24h)
        
        # Format priority discoveries (top 5)
        priority_discoveries = [
            JobResponse.model_validate(job) for job in jobs_24h[:5]
        ]
        
        return {
            "stats": {
                "jobsFound24h": jobs_count_24h,
                "autoApplications24h": applications_24h,
            },
            "priorityDiscoveries": priority_discoveries,
            "meta": {
                "since": since_24h.isoformat(),
                "generatedAt": now.isoformat(),
            }
        }
    
    async def get_analytics_data(self, user_id: UUID) -> Dict[str, Any]:
        """
        Analytics data for dashboard visualizations.
        Returns:
        - heatmapData: Array of job counts for last 14 days
        - marketShare: Distribution of jobs by portal
        """
        from sqlalchemy import select, func, cast, Date
        from app.models.job.user_job_map import UserJobMap
        from app.models.job.job import Job
        from app.constants.constants import Portal
        
        now = datetime.utcnow()
        
        # --- Heatmap Data: Jobs per day for last 14 days ---
        heatmap_data = []
        for days_ago in range(13, -1, -1):  # 13 to 0 (14 days, oldest first)
            day_start = (now - timedelta(days=days_ago)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            count_query = select(func.count(UserJobMap.job_id)).where(
                UserJobMap.user_id == user_id,
                UserJobMap.created_at >= day_start,
                UserJobMap.created_at < day_end
            )
            result = await self.db.execute(count_query)
            count = result.scalar() or 0
            heatmap_data.append(count)
        
        # --- Market Share: Jobs by Portal ---
        portal_query = select(
            Job.portal,
            func.count(Job.id).label('count')
        ).join(UserJobMap, UserJobMap.job_id == Job.id).where(
            UserJobMap.user_id == user_id
        ).group_by(Job.portal)
        
        portal_result = await self.db.execute(portal_query)
        portal_counts = dict(portal_result.all())
        
        total_jobs = sum(portal_counts.values()) if portal_counts else 0
        
        # Build market share array
        portal_colors = {
            Portal.LINKEDIN.value: "bg-brand-500",
            Portal.NAUKRI.value: "bg-slate-500",
            Portal.INDEED.value: "bg-blue-500",
            Portal.GLASSDOOR.value: "bg-emerald-500",
            Portal.OTHER.value: "bg-slate-400",
        }
        
        portal_labels = {
            Portal.LINKEDIN.value: "LinkedIn",
            Portal.NAUKRI.value: "Naukri",
            Portal.INDEED.value: "Indeed",
            Portal.GLASSDOOR.value: "Glassdoor",
            Portal.OTHER.value: "Other",
        }
        
        market_share = []
        for portal_value, count in portal_counts.items():
            percentage = round((count / total_jobs) * 100) if total_jobs > 0 else 0
            market_share.append({
                "label": portal_labels.get(portal_value, "Unknown"),
                "value": percentage,
                "count": count,
                "color": portal_colors.get(portal_value, "bg-slate-400")
            })
        
        # Sort by value descending
        market_share.sort(key=lambda x: x["value"], reverse=True)
        
        # If no data, return defaults
        if not market_share:
            market_share = [
                {"label": "LinkedIn", "value": 0, "count": 0, "color": "bg-brand-500"},
                {"label": "Naukri", "value": 0, "count": 0, "color": "bg-slate-500"},
                {"label": "Direct", "value": 0, "count": 0, "color": "bg-slate-400"},
            ]
        
        return {
            "heatmapData": heatmap_data,
            "marketShare": market_share,
            "meta": {
                "totalJobs": total_jobs,
                "periodDays": 14,
                "generatedAt": now.isoformat()
            }
        }
    
    async def get_dashboard_data(self, user_id: UUID) -> Dict[str, Any]:
        """Complete dashboard with REAL DB data (sequential fetching to avoid session conflicts)"""
        
        user = await self.user_service.get_user(user_id)
        completeness = await self.profile_service.calculate_completeness(user_id)
        experiences = await self.experience_service.get_all(user_id)
        projects = await self.project_service.get_all(user_id)
        educations = await self.education_service.get_all(user_id)
        certifications = await self.certification_service.get_all(user_id)
        resumes = await self.resume_service.get_all(user_id)
        languages = await self.language_service.get_all(user_id)
        skills = await self.user_skill_service.get_user_skills(user_id)
        jobs = await self.job_service.get_user_jobs(user_id)
        app_stats = await self.application_service.get_application_stats(user_id)
        recent_activity = await self._get_recent_activity(user_id)
        calendar = await self._get_calendar_events(user_id)
        
        data = (user, completeness, experiences, projects, educations, certifications, 
                resumes, languages, skills, jobs, app_stats, recent_activity, calendar)
        
        return self._format_dashboard(data)
    
    async def _get_recent_activity(self, user_id: UUID) -> List[Dict]:
        """REAL recent activity from activity_log table (last 7 days)"""
        activities = await self.activity_repo.get_recent_by_user(
            user_id=user_id, 
            days=7, 
            limit=10
        )
        
        return [
            {
                "id": activity.id,
                "type": activity.activity_type,  # scrape, application, profile_update
                "portal": getattr(activity, 'portal_slug', None),
                "keywords": getattr(activity, 'search_keywords', None),
                "job_title": getattr(activity, 'job_title', None),
                "jobs_found": getattr(activity, 'jobs_count', 0),
                "status": getattr(activity, 'status', None),
                "timestamp": activity.created_at.isoformat(),
                "icon": self._get_activity_icon(activity.activity_type)
            }
            for activity in activities
        ]
    
    async def _get_calendar_events(self, user_id: UUID) -> Dict:
        """REAL upcoming interviews + deadlines from applications table"""
        # Next interview (status='interview_scheduled' ORDER BY date ASC LIMIT 1)
        next_interview = await self.application_service.get_next_interview(user_id)
        
        # Application deadlines (status='applied' + deadline field)
        deadlines = await self.application_service.get_upcoming_deadlines(user_id, days=14)
        
        return {
            "next_interview": next_interview.created_at.isoformat() if next_interview else None,
            "application_deadlines": [
                {
                    "job": app.job.title,
                    "company": app.job.company,
                    "deadline": app.deadline.isoformat() if app.deadline else None,
                    "days_left": (app.deadline - datetime.utcnow()).days if app.deadline else None
                }
                for app in deadlines
            ],
            "upcoming": [
                {
                    "title": f"{app.job.company} - {app.job.title}",
                    "date": app.interview_date.strftime("%b %d, %I:%M %p IST") if app.interview_date else "TBD",
                    "type": "interview" if app.status == "interview_scheduled" else "deadline"
                }
                for app in deadlines[:3]
            ]
        }
    
    def _format_dashboard(self, data: tuple) -> Dict[str, Any]:
        """Format raw DB data for frontend"""
        (user, completeness, experiences, projects, educations, certifications, 
         resumes, languages, skills, jobs, app_stats, recent_activity, calendar) = data
        
        return {
            "profile": {
                "completeness": completeness,
                "sections": {
                    "experiences": len(experiences.experiences),
                    "projects": len(projects.projects),
                    "educations": len(educations.educations),
                    "certifications": len(certifications.certifications),
                    "resumes": len(resumes.resumes),
                    "languages": len(languages.languages),
                    "skills": len(skills.skills)
                }
            },
            "recent_activity": recent_activity[:5],
            "applications": {
                "pipeline": app_stats,  # {"applied": 6, "interview": 2, "offer": 0}
                "recent": self._format_recent_applications(jobs.jobs, app_stats)
            },
            "saved_jobs": jobs.jobs[:5],
            "calendar": calendar,
            "quick_actions": self._get_quick_actions(
                completeness, 
                len(experiences.experiences),
                len(jobs.jobs)
            ),
            "last_sync": datetime.now(ZoneInfo("Asia/Kolkata")).isoformat(),
            "server_time": datetime.utcnow().isoformat(),
            "timezone": "Asia/Kolkata",
            "portals": []
        }
    
    def _format_recent_applications(self, jobs: List[Job], app_stats: Dict) -> List[Dict]:
        """Format recent applications from jobs table"""
        return [
            {
                "title": job.title,
                "company": job.company,
                "status": "saved",  # applied/interview from applications table
                "date": job.created_at.strftime("%b %d"),
                "icon": "💼"
            }
            for job in jobs[:3]
        ]
    
    def _get_activity_icon(self, activity_type: str) -> str:
        """Activity type → emoji"""
        icons = {
            "scrape": "🔍",
            "application": "📋", 
            "profile_update": "👤",
            "skill_added": "⭐",
            "job_saved": "💼"
        }
        return icons.get(activity_type, "📊")
    
    def _get_quick_actions(self, completeness: int, experiences: int, jobs_count: int) -> List[Dict]:
        """Smart quick actions based on DB data"""
        actions = []
        
        if completeness < 50:
            actions.append({
                "title": "📄 Upload Resume",
                "description": "Auto-fill 85% of profile",
                "endpoint": "/profile/resumes/upload",
                "priority": "high"
            })
        
        if experiences == 0:
            actions.append({
                "title": "💼 Add Experiences",
                "description": "Extract from resume",
                "endpoint": "/profile/experiences",
                "priority": "high"
            })
        
        if jobs_count == 0:
            actions.append({
                "title": "🔍 Scrape Jobs",
                "description": "Naukri + LinkedIn (25+ jobs)",
                "endpoint": "/scrapers/naukri",
                "priority": "high"
            })
        else:
            actions.append({
                "title": "🚀 Bulk Apply",
                "description": f"Apply to {min(jobs_count, 10)} saved jobs",
                "endpoint": "/applications/bulk",
                "priority": "medium"
            })
        
        return actions[:3]
