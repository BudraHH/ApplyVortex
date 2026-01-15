"""Background tasks for automated job applications."""

import logging
from uuid import UUID

from app.db.session import async_session
from app.repositories.job.application_repository import ApplicationRepository
from app.repositories.job.job_repository import JobRepository
from app.repositories.user.user_repository import UserRepository
from app.repositories.user.resume_repository import ResumeRepository
from app.repositories.user.agent_repository import AgentRepository
from app.repositories.agent_task_repository import AgentTaskRepository
from app.services.profile.tailor_service import ResumeTailorService
from app.constants.constants import ApplicationSource, AgentTaskType, ApplicationStatus as JobApplicationStatus

logger = logging.getLogger(__name__)

async def run_job_application_task(application_id: UUID):
    """
    Main task to run an automated job application.
    """
    logger.info(f"Starting automated application task for {application_id}")
    
    async with async_session() as session:
        app_repo = ApplicationRepository(session)
        job_repo = JobRepository(session)
        user_repo = UserRepository(session)
        tailor_service = ResumeTailorService(session)
        
        try:
            # 1. Fetch Application and Data
            application = await app_repo.get(application_id)
            if not application:
                raise ValueError("Application not found")
            
            job = await job_repo.get(application.job_id)
            user = await user_repo.get(application.user_id)
            
            # Update status
            await app_repo.update(application_id, {
                "automation_status": "started",
                "application_source": ApplicationSource.AUTO_APPLY
            })
            await session.commit()

            # Global Safety Check: Check if already applied to this universal requisition
            if job.requisition_id:
                existing_app = await app_repo.get_by_requisition_id(job.requisition_id, user.id)
                if existing_app and existing_app.id != application_id:
                    logger.warning(f"Safety: Requisition {job.requisition_id} already applied (App ID: {existing_app.id}). Skipping.")
                    await app_repo.update(application_id, {
                        "status": JobApplicationStatus.APPLIED,
                        "automation_status": "completed",
                        "notes": f"Skipped: Already applied to this requisition ({job.requisition_id}) via another portal."
                    })
                    await session.commit()
                    return
            
            # 2. Tailor Resume if needed
            # We use the resume linked to the application or user's default
            resume_id = application.resume_used_id
            if not resume_id:
                # Fallback to default
                resumes_repo = ResumeRepository(session)
                default_resume = await resumes_repo.get_default_resume(user.id)
                if not default_resume:
                    raise Exception("No resume found for application")
                resume_id = default_resume.id
            
            # Tailor it
            logger.info(f"Tailoring resume for job: {job.title}")
            tailored_resume = await tailor_service.tailor_resume(
                user_id=user.id,
                base_resume_id=resume_id,
                job_description=job.description,
                job_id=job.id
            )
            
            # 3. Queue Agent Task
            agent_repo = AgentRepository(session)
            task_repo = AgentTaskRepository(session)
            
            # Find an active agent for the user
            # TODO: Add specific agent selection logic if user has multiple
            agents = await agent_repo.get_all_by_user(user.id)
            if not agents:
                 raise Exception("No registered agents found for user. Please install and run the Agent.")
            
            # Prefer online agents
            target_agent = next((a for a in agents if a.status == "online"), agents[0])
            
            # Construct Payload
            task_payload = {
                "job_id": str(job.id),  # Agent needs this for tracking
                "job_url": job.job_post_url,
                "resume_id": str(tailored_resume.id), 
                "application_id": str(application_id),
                "job_title": job.title,
                "company": job.company_name
            }
            
            # Create Task
            logger.info(f"Dispatching APPLY task to Agent {target_agent.hostname} ({target_agent.id})")
            await task_repo.create_task(
                user_id=user.id,
                task_type=AgentTaskType.APPLY,
                payload=task_payload,
                blueprint_id=application.blueprint_id if hasattr(application, 'blueprint_id') else None
            )
            
            await app_repo.update(application_id, {
                "automation_status": "queued", # New status indicating waiting for agent
                "notes": f"Queued for Agent {target_agent.hostname}"
            })
            await session.commit()
                    
        except Exception as e:
            logger.error(f"Automated application orchestration failed for {application_id}: {e}")
            try:
                await app_repo.update(application_id, {
                    "automation_status": "failed",
                    "error_message": str(e)
                })
                await session.commit()
            except:
                pass

# Note: We need to import ResumeRepository and UserRepository correctly.
# I'll check if they are in the expected locations.
