# app/tasks/cleanup.py
from datetime import datetime, timedelta
from app.db.session import async_session
from app.repositories.user.session_repository import SessionRepository

async def cleanup_expired_sessions():
    """Clean up expired sessions older than 7 days"""
    async with async_session() as session:
        repo = SessionRepository(session)
        count = await repo.cleanup_expired()
        return count