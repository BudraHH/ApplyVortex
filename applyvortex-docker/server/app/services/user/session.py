from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user.session_repository import SessionRepository
from app.schemas.user.session import (
    ActiveSessionsResponse, 
    RevokeSession, 
    RevokeAllSessions
)
from app.core.config import settings
from app.core.exceptions import PermissionDenied


class SessionService:
    def __init__(self, db: AsyncSession = None, session_repo: SessionRepository = None):
        self.db = db
        self.session_repo = session_repo or SessionRepository(db)
    
    async def get_active_sessions(self, user_id: UUID) -> ActiveSessionsResponse:
        """Get all active sessions for user"""
        sessions = await self.session_repo.get_active_sessions(user_id)
        return ActiveSessionsResponse(
            sessions=sessions,
            active_sessions_count=len(sessions),
            max_sessions=settings.MAX_SESSIONS_PER_USER
        )
    
    async def revoke_session(self, user_id: UUID, session_id: UUID, data: RevokeSession) -> bool:
        """Revoke specific session (only own sessions)"""
        # Verify session belongs to user
        active_sessions = await self.session_repo.get_active_sessions(user_id)
        session_ids = [s.id for s in active_sessions]
        
        if session_id not in session_ids:
            raise PermissionDenied("Cannot revoke other user's session")
        
        return await self.session_repo.revoke_session(session_id, data.reason)
    
    async def revoke_all_sessions(self, user_id: UUID, data: RevokeAllSessions) -> int:
        """Logout from all devices"""
        return await self.session_repo.revoke_all_sessions(user_id, data.reason)
    
    async def enforce_session_limit(self, user_id: UUID) -> List[UUID]:
        """Auto-revoke oldest sessions if limit exceeded"""
        sessions = await self.session_repo.get_active_sessions(user_id, limit=100)
        
        if len(sessions) > settings.MAX_SESSIONS_PER_USER:
            excess_sessions = sessions[settings.MAX_SESSIONS_PER_USER:]
            revoked_ids = []
            
            for session in excess_sessions:
                await self.session_repo.revoke_session(
                    session.id, 
                    "Session limit exceeded - oldest sessions revoked"
                )
                revoked_ids.append(session.id)
            
            return revoked_ids
        
        return []
    
    async def cleanup_expired(self) -> int:
        """Admin-only: Cleanup expired sessions (weekly cron)"""
        return await self.session_repo.cleanup_expired()
