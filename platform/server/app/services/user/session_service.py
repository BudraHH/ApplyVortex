from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from fastapi import HTTPException, status

from app.models.user.session import UserSession
from app.schemas.user.settings import SessionResponse, SessionsListResponse


class SessionService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_user_sessions(self, user_id: UUID, current_session_id: Optional[str] = None) -> SessionsListResponse:
        """
        Get all active sessions for a user.
        """
        # Query all active (non-revoked, non-expired) sessions
        result = await self.db.execute(
            select(UserSession)
            .where(
                and_(
                    UserSession.user_id == user_id,
                    UserSession.revoked_at.is_(None),
                    UserSession.expires_at > datetime.utcnow()
                )
            )
            .order_by(UserSession.last_activity_at.desc())
        )
        sessions = result.scalars().all()
        
        # Convert to response format
        session_responses = []
        for session in sessions:
            session_responses.append(SessionResponse(
                id=str(session.id),
                device_name=session.device_name,
                user_agent=session.user_agent,
                ip_address=str(session.ip_address) if session.ip_address else None,
                country=session.country,
                city=session.city,
                last_activity_at=session.last_activity_at.isoformat(),
                created_at=session.created_at.isoformat(),
                is_current=(str(session.id) == current_session_id)
            ))
        
        return SessionsListResponse(
            sessions=session_responses,
            total=len(session_responses)
        )
    
    async def revoke_session(self, user_id: UUID, session_id: UUID, current_session_id: Optional[UUID] = None) -> dict:
        """
        Revoke a specific session (logout from a device).
        """
        # Prevent revoking current session
        if current_session_id and session_id == current_session_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot revoke your current session. Use logout instead."
            )
        
        # Get the session
        result = await self.db.execute(
            select(UserSession)
            .where(
                and_(
                    UserSession.id == session_id,
                    UserSession.user_id == user_id
                )
            )
        )
        session = result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Revoke the session
        session.revoke(reason="Manually revoked by user")
        await self.db.commit()
        
        return {"message": "Session revoked successfully"}
    
    async def revoke_all_other_sessions(self, user_id: UUID, current_session_id: UUID) -> dict:
        """
        Revoke all sessions except the current one (logout from all other devices).
        """
        # Get all active sessions except current
        result = await self.db.execute(
            select(UserSession)
            .where(
                and_(
                    UserSession.user_id == user_id,
                    UserSession.id != current_session_id,
                    UserSession.revoked_at.is_(None)
                )
            )
        )
        sessions = result.scalars().all()
        
        # Revoke all sessions
        revoked_count = 0
        for session in sessions:
            session.revoke(reason="Logged out from all other devices")
            revoked_count += 1
        
        await self.db.commit()
        
        return {
            "message": f"Successfully logged out from {revoked_count} other device(s)",
            "revoked_count": revoked_count
        }

    async def revoke_all_user_sessions(self, user_id: UUID, reason: str = "Account scheduled for deletion") -> int:
        """
        Revoke all sessions for a user.
        """
        result = await self.db.execute(
            select(UserSession)
            .where(
                and_(
                    UserSession.user_id == user_id,
                    UserSession.revoked_at.is_(None)
                )
            )
        )
        sessions = result.scalars().all()
        
        revoked_count = 0
        for session in sessions:
            session.revoke(reason=reason)
            revoked_count += 1
        
        await self.db.commit()
        return revoked_count

