from typing import List
from uuid import UUID
import asyncio
import logging
from app.core.celery_app import celery_app
# from app.services.automation.agent_service import ApplyVortexAgent
from app.core.database import async_session_maker

from app.repositories.user.notification_repository import NotificationRepository
from app.constants.constants import NotificationType

logger = logging.getLogger(__name__)


# async def _process_applications(user_id: UUID, job_ids: List[UUID], base_resume_id: UUID):
#     """
#     Async helper to run the agent workflow inside a Celery task.
#     """
#     import random
#     
#     logger.info(f"Worker starting bulk apply for user {user_id} on {len(job_ids)} jobs")
#     
#     async with async_session_maker() as session:
#         # agent = ApplyVortexAgent(session) # Moved to external agent
#         notification_repo = NotificationRepository(session)
#         
#         for i, job_id in enumerate(job_ids):
#             try:
#                 job_id_obj = UUID(str(job_id)) # Ensure UUID
#                 logger.info(f"Processing job {i+1}/{len(job_ids)}: {job_id}")
#                 
#                 # 1. Human-like delay (Smart Throttling)
#                 # if i > 0:
#                 #     delay = random.uniform(60, 180) # 1-3 minutes between applications
#                 #     logger.info(f"Throttling for {delay:.2f} seconds...")
#                 #     await asyncio.sleep(delay)
#                 
#                 # 2. Run Agent Workflow
#                 # result = await agent.run_application_workflow(
#                 #     user_id=user_id, 
#                 #     job_id=job_id_obj, 
#                 #     base_resume_id=base_resume_id
#                 # )
#                 
#                 # logger.info(f"Job {job_id} result: {result}")
# 
#                 # 3. Notify Success
#                 await notification_repo.create_notification(
#                     user_id=user_id,
#                     type=NotificationType.APPLICATION,
#                     title="Application Auto-Submitted",
#                     message=f"Autonomous agent successfully processed application for job {job_id}.",
#                     action_url=f"/jobs",
#                     metadata={"job_id": str(job_id), "result": "Moved to external agent"}
#                 )
#                 await session.commit()
#                 
#             except Exception as e:
#                 logger.error(f"Failed to auto-apply for job {job_id}: {e}")
#                  # 4. Notify Failure
#                 try:
#                     await notification_repo.create_notification(
#                         user_id=user_id,
#                         type=NotificationType.SYSTEM,
#                         title="Application Failed",
#                         message=f"Autonomous agent encountered an error applying for job {job_id}.",
#                         action_url=f"/jobs",
#                         metadata={"job_id": str(job_id), "error": str(e)}
#                     )
#                     await session.commit()
#                 except Exception as notify_err:
#                     logger.error(f"Failed to send failure notification: {notify_err}")
#                 continue
# 
# @celery_app.task(acks_late=True)
# def celery_bulk_apply(user_id: str, job_ids: List[str], base_resume_id: str):
#     """
#     Celery task wrapper for bulk application process.
#     """
#     # try:
#     #     # We need an event loop to run async code
#     #     loop = asyncio.get_event_loop()
#     # except RuntimeError:
#     #     loop = asyncio.new_event_loop()
#     #     asyncio.set_event_loop(loop)
#     
#     # loop.run_until_complete(
#     #     _process_applications(
#     #         UUID(user_id), 
#     #         [UUID(jid) for jid in job_ids], 
#     #         UUID(base_resume_id)
#     #     )
#     # )
#     return f"Completed bulk apply for user {user_id}"

@celery_app.task(name="cleanup_deleted_accounts")
def cleanup_deleted_accounts():
    """
    Permanently delete accounts that have been soft-deleted for more than 30 days.
    """
    from sqlalchemy import delete, and_
    from datetime import datetime, timedelta, timezone
    from app.models.user.user import User

    async def _cleanup():
        async with async_session_maker() as session:
            thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
            stmt = delete(User).where(
                and_(
                    User.deleted_at.is_not(None),
                    User.deleted_at < thirty_days_ago
                )
            )
            result = await session.execute(stmt)
            deleted_count = result.rowcount
            await session.commit()
            logger.info(f"Hard-deleted {deleted_count} accounts that were past the 30-day grace period.")
            return deleted_count

    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    count = loop.run_until_complete(_cleanup())
    return f"Cleaned up {count} accounts"


@celery_app.task(name="send_deletion_warning_email")
def send_deletion_warning_email(email: str, name: str):
    """
    Send an email to the user warning them that their account is scheduled for deletion.
    """
    from app.services.email.email_service import EmailService
    from app.core.config import settings
    
    email_service = EmailService()
    
    subject = "Your account is scheduled for deletion"
    restore_url = f"{settings.CLIENT_URL}/login" # Logging in triggers restoration prompt
    body = f"""
    <html>
        <body>
            <h2>Hello {name},</h2>
            <p>Your account at {settings.PROJECT_NAME} has been scheduled for deletion as per your request.</p>
            <p>Your data will be permanently deleted in <b>30 days</b>.</p>
            <p>If this was a mistake, or you've changed your mind, you can restore your account simply by logging in within the next 30 days:</p>
            <p><a href='{restore_url}'>Restore My Account</a></p>
            <p>If you take no action, your account and all associated data will be permanently removed after the grace period.</p>
            <p>Best regards,<br>The {settings.PROJECT_NAME} Team</p>
        </body>
    </html>
    """
    
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    loop.run_until_complete(email_service.send_email(subject, [email], body))
    return f"Sent deletion warning email to {email}"


@celery_app.task(name="send_security_alert_email")
def send_security_alert_email(email: str, name: str, event: str):
    """
    Send an email notification for sensitive security events (e.g., password change).
    """
    from app.services.email.email_service import EmailService
    from app.core.config import settings
    
    email_service = EmailService()
    
    event_titles = {
        "password_change": "Your password was changed",
        "2fa_enable": "Two-factor authentication enabled",
        "2fa_disable": "Two-factor authentication disabled"
    }
    
    subject = event_titles.get(event, "Security Alert")
    body = f"""
    <html>
        <body>
            <h2>Security Alert</h2>
            <p>Hello {name},</p>
            <p>This is a notification that a sensitive action was performed on your {settings.PROJECT_NAME} account:</p>
            <p><b>Action:</b> {subject}</p>
            <p><b>Timestamp:</b> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
            <p>If you performed this action, you can safely ignore this email.</p>
            <p><b>If you did NOT perform this action, please contact our security team immediately or reset your password.</b></p>
            <p>Best regards,<br>The {settings.PROJECT_NAME} Team</p>
        </body>
    </html>
    """
    
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    loop.run_until_complete(email_service.send_email(subject, [email], body))
    return f"Sent security alert ({event}) to {email}"


# Celery Beat Schedule for Periodic Tasks
celery_app.conf.beat_schedule = {
    'check-offline-agents': {
        'task': 'check_offline_agents',
        'schedule': 120.0,  # Every 2 minutes
    },
    'reset-rate-limits': {
        'task': 'reset_rate_limits',
        'schedule': 3600.0,  # Every hour
    },
    'cleanup-deleted-accounts': {
        'task': 'cleanup_deleted_accounts',
        'schedule': 86400.0, # Once a day (24 hours)
    },
}
