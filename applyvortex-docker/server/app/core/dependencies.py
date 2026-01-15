from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.core.database import get_session
from app.core.security import get_current_user, get_current_active_user
from app.core.config import settings
from app.models.user.user import User

# Repositories
# from app.repositories.user.user_repository import UserRepository
from app.repositories.user.profile_repository import ProfileRepository
from app.repositories.user.experience_repository import ExperienceRepository
from app.repositories.user.education_repository import EducationRepository
from app.repositories.user.project_repository import ProjectRepository
from app.repositories.user.certification_repository import CertificationRepository
from app.repositories.user.resume_repository import ResumeRepository
from app.repositories.user.language_repository import LanguageRepository
from app.repositories.skill.skill_repository import SkillRepository
from app.repositories.skill.user_skill_repository import UserSkillRepository
from app.repositories.job.job_repository import JobRepository
from app.repositories.job.application_repository import ApplicationRepository
from app.repositories.job.portal_repository import PortalRepository
from app.repositories.user.notification_repository import NotificationRepository
from app.repositories.job.match_repository import JobMatchRepository
from app.repositories.agent_task_repository import AgentTaskRepository
from app.repositories.user.accomplishment_repository import AccomplishmentRepository
from app.repositories.user.research_repository import ResearchRepository

# Database session
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_session():
        yield session

# Skill repositories
async def get_skill_repo(db: AsyncSession = Depends(get_db)) -> SkillRepository:
    return SkillRepository(db)

async def get_user_skill_repo(
    db: AsyncSession = Depends(get_db),
    skill_repo: SkillRepository = Depends(get_skill_repo)
) -> UserSkillRepository:
    return UserSkillRepository(db, skill_repo)

# User repositories
async def get_user_repo(db: AsyncSession = Depends(get_db)) -> 'UserRepository':
    from app.repositories.user.user_repository import UserRepository
    return UserRepository(db)

async def get_profile_repo(
    db: AsyncSession = Depends(get_db),
    user_repo = Depends(get_user_repo)
) -> ProfileRepository:
    return ProfileRepository(db)

async def get_experience_repo(
    db: AsyncSession = Depends(get_db),
    skill_repo: SkillRepository = Depends(get_skill_repo),
    user_skill_repo: UserSkillRepository = Depends(get_user_skill_repo)
) -> ExperienceRepository:
    return ExperienceRepository(db, skill_repo, user_skill_repo)

async def get_education_repo(db: AsyncSession = Depends(get_db)) -> EducationRepository:
    return EducationRepository(db)

async def get_project_repo(
    db: AsyncSession = Depends(get_db),
    skill_repo: SkillRepository = Depends(get_skill_repo),
    user_skill_repo: UserSkillRepository = Depends(get_user_skill_repo)
) -> ProjectRepository:
    return ProjectRepository(db, skill_repo, user_skill_repo)

async def get_certification_repo(db: AsyncSession = Depends(get_db)) -> CertificationRepository:
    return CertificationRepository(db)

async def get_resume_repo(db: AsyncSession = Depends(get_db)) -> ResumeRepository:
    return ResumeRepository(db)

async def get_language_repo(db: AsyncSession = Depends(get_db)) -> LanguageRepository:
    return LanguageRepository(db)

# Job repositories
async def get_job_repo(db: AsyncSession = Depends(get_db)) -> JobRepository:
    return JobRepository(db)

async def get_application_repo(db: AsyncSession = Depends(get_db)) -> ApplicationRepository:
    return ApplicationRepository(db)

async def get_portal_repo(db: AsyncSession = Depends(get_db)) -> PortalRepository:
    return PortalRepository(db)

async def get_notification_repo(db: AsyncSession = Depends(get_db)) -> NotificationRepository:
    return NotificationRepository(db)

async def get_job_match_repo(db: AsyncSession = Depends(get_db)) -> JobMatchRepository:
    return JobMatchRepository(db)

async def get_agent_task_repo(db: AsyncSession = Depends(get_db)) -> AgentTaskRepository:
    return AgentTaskRepository(db)

async def get_accomplishment_repo(db: AsyncSession = Depends(get_db)) -> AccomplishmentRepository:
    return AccomplishmentRepository(db)

async def get_research_repo(db: AsyncSession = Depends(get_db)) -> ResearchRepository:
    return ResearchRepository(db)

# SERVICE FACTORIES (Required by endpoints)
async def get_profile_service(
    db: AsyncSession = Depends(get_db),
    user_repo = Depends(get_user_repo),
    notif_repo: NotificationRepository = Depends(get_notification_repo)
) -> 'ProfileService':
    from app.services.profile.profile_service import ProfileService
    return ProfileService(db=db, profile_repo=ProfileRepository(db), notification_repo=notif_repo)

async def get_user_service(
    db: AsyncSession = Depends(get_db),
    profile_service: 'ProfileService' = Depends(get_profile_service)
) -> 'UserService':
    from app.services.user.user import UserService
    from app.repositories.user.user_repository import UserRepository
    return UserService(user_repo=UserRepository(db), profile_service=profile_service)

async def get_experience_service(
    db: AsyncSession = Depends(get_db),
    skill_repo: SkillRepository = Depends(get_skill_repo),
    user_skill_repo: UserSkillRepository = Depends(get_user_skill_repo),
    notif_repo: NotificationRepository = Depends(get_notification_repo)
) -> 'ExperienceService':
    from app.services.profile.experience_service import ExperienceService
    return ExperienceService(
        db=db,
        experience_repo=ExperienceRepository(db, skill_repo, user_skill_repo),
        notification_repo=notif_repo
    )

async def get_education_service(
    db: AsyncSession = Depends(get_db),
    notif_repo: NotificationRepository = Depends(get_notification_repo)
) -> 'EducationService':
    from app.services.profile.education_service import EducationService
    return EducationService(db=db, education_repo=EducationRepository(db), notification_repo=notif_repo)

async def get_project_service(
    db: AsyncSession = Depends(get_db),
    skill_repo: SkillRepository = Depends(get_skill_repo),
    user_skill_repo: UserSkillRepository = Depends(get_user_skill_repo),
    notif_repo: NotificationRepository = Depends(get_notification_repo)
) -> 'ProjectService':
    from app.services.profile.project_service import ProjectService
    return ProjectService(
        db=db,
        project_repo=ProjectRepository(db, skill_repo, user_skill_repo),
        notification_repo=notif_repo
    )

async def get_certification_service(
    db: AsyncSession = Depends(get_db),
    notif_repo: NotificationRepository = Depends(get_notification_repo)
) -> 'CertificationService':
    from app.services.profile.certifications_service import CertificationService
    return CertificationService(db=db, certification_repo=CertificationRepository(db), notification_repo=notif_repo)

async def get_accomplishment_service(
    db: AsyncSession = Depends(get_db),
    notif_repo: NotificationRepository = Depends(get_notification_repo)
) -> 'AccomplishmentService':
    from app.services.profile.accomplishment_service import AccomplishmentService
    return AccomplishmentService(
        db=db, 
        accomplishment_repo=AccomplishmentRepository(db), 
        notification_repo=notif_repo
    )

async def get_research_service(
    db: AsyncSession = Depends(get_db),
    notif_repo: NotificationRepository = Depends(get_notification_repo)
) -> 'ResearchService':
    from app.services.user.research_service import ResearchService
    return ResearchService(
        db=db, 
        research_repo=ResearchRepository(db), 
        notification_repo=notif_repo
    )

async def get_resume_service(db: AsyncSession = Depends(get_db)) -> 'ResumeService':
    from app.services.profile.resume_service import ResumeService
    return ResumeService(resume_repo=ResumeRepository(db))

async def get_language_service(
    db: AsyncSession = Depends(get_db),
    notif_repo: NotificationRepository = Depends(get_notification_repo)
) -> 'LanguageService':
    from app.services.profile.language_service import LanguageService
    return LanguageService(db=db, language_repo=LanguageRepository(db), notification_repo=notif_repo)

async def get_user_skill_service(
    db: AsyncSession = Depends(get_db),
    skill_repo: SkillRepository = Depends(get_skill_repo),
    notif_repo: NotificationRepository = Depends(get_notification_repo)
) -> 'UserSkillService':
    from app.services.skills.user_skill import UserSkillService
    return UserSkillService(db=db, user_skill_repo=UserSkillRepository(db, skill_repo), notification_repo=notif_repo)

async def get_job_service(db: AsyncSession = Depends(get_db)) -> 'JobService':
    from app.services.job.job import JobService
    return JobService(job_repo=JobRepository(db))

async def get_application_service(db: AsyncSession = Depends(get_db)) -> 'ApplicationService':
    from app.services.job.application import ApplicationService
    return ApplicationService(application_repo=ApplicationRepository(db))



async def get_skill_service(db: AsyncSession = Depends(get_db)) -> 'SkillService':
    from app.services.skills.skill import SkillService
    return SkillService(skill_repo=SkillRepository(db))



async def get_job_match_service(
    db: AsyncSession = Depends(get_db),
    user_skill_repo = Depends(get_user_skill_repo)
) -> 'JobMatchingService':
    from app.services.job.match_service import JobMatchingService
    return JobMatchingService(db=db, user_skill_repo=user_skill_repo)

async def get_scraper_service(
    db: AsyncSession = Depends(get_db),
    job_service=Depends(get_job_service),
    job_match_service=Depends(get_job_match_service),
    agent_task_repo=Depends(get_agent_task_repo)
) -> 'ScraperService':

    from app.services.scrapers.scrapers_service import ScraperService
    from app.repositories.job.blueprint_repository import BlueprintRepository
    
    return ScraperService(
        job_service=job_service, 
        match_service=job_match_service,
        agent_task_repo=agent_task_repo,
        blueprint_repo=BlueprintRepository(db)
    )

async def get_auth_service(db: AsyncSession = Depends(get_db)) -> 'AuthService':
    from app.services.auth.auth_service import AuthService
    from app.repositories.user.user_repository import UserRepository
    return AuthService(user_repo=UserRepository(db))

# User dependencies
async def get_current_user_id(current_user: User = Depends(get_current_user)) -> UUID:
    return current_user.id

async def get_current_user_obj(current_user_id: UUID = Depends(get_current_user_id)) -> User:
    from app.repositories.user.user_repository import UserRepository
    user_repo = UserRepository(Depends(get_db)())
    user = await user_repo.get_by_id(current_user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

# Dashboard service
async def get_dashboard_service(
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
) -> 'DashboardService':
    from app.services.dashboard.dashboard_service import DashboardService
    return DashboardService(
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

async def get_complete_profile_service(
    db: AsyncSession = Depends(get_db),
    profile_service: 'ProfileService' = Depends(get_profile_service),
    experience_service: 'ExperienceService' = Depends(get_experience_service),
    project_service: 'ProjectService' = Depends(get_project_service),
    education_service: 'EducationService' = Depends(get_education_service),
    certification_service: 'CertificationService' = Depends(get_certification_service),
    resume_service: 'ResumeService' = Depends(get_resume_service),
    language_service: 'LanguageService' = Depends(get_language_service),
    user_skill_service: 'UserSkillService' = Depends(get_user_skill_service),
    accomplishment_service: 'AccomplishmentService' = Depends(get_accomplishment_service),
    research_service: 'ResearchService' = Depends(get_research_service)
) -> 'CompleteProfileService':
    from app.services.profile.complete_service import CompleteProfileService
    return CompleteProfileService(
        db=db,
        profile_service=profile_service,
        experience_service=experience_service,
        project_service=project_service,
        education_service=education_service,
        certification_service=certification_service,
        resume_service=resume_service,
        language_service=language_service,
        skill_service=user_skill_service,
        accomplishment_service=accomplishment_service,
        research_service=research_service
    )

async def get_intelligence_service(
    db: AsyncSession = Depends(get_db)
) -> 'IntelligenceService':
    from app.services.intelligence.intelligence_service import IntelligenceService
    return IntelligenceService(db=db)

