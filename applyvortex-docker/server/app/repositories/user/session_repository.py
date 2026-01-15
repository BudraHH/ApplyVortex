# app/repositories/user/session_repository.py

from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy import delete, select, update, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user.session import UserSession
from app.repositories.base import BaseRepository

class SessionRepository(BaseRepository[UserSession]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, UserSession)

    async def get_by_id(self, session_id: UUID) -> Optional[UserSession]:
        """
        Get session by ID. 
        Uses BaseRepository's get method internally.
        """
        return await self.get(session_id)

    async def get_by_refresh_token(self, refresh_token_hash: str) -> Optional[UserSession]:
        """
        Get a session by refresh token hash, ensuring it hasn't been revoked.
        """
        query = select(UserSession).where(
            and_(
                UserSession.refresh_token_hash == refresh_token_hash,
                UserSession.revoked_at.is_(None)
            )
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_by_access_jti(self, jti: str) -> Optional[UserSession]:
        """
        Get a session by Access Token JTI (ID).
        """
        query = select(UserSession).where(UserSession.access_token_jti == jti)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_active_sessions(self, user_id: UUID, limit: int = 100) -> List[UserSession]:
        """
        Get all active sessions for a specific user.
        """
        query = select(UserSession).where(
            and_(
                UserSession.user_id == user_id,
                UserSession.revoked_at.is_(None),
                UserSession.expires_at > datetime.utcnow()
            )
        ).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def revoke_session(self, session_id: UUID, reason: Optional[str] = None) -> bool:
        """
        Revoke a specific session.
        """
        session = await self.get(session_id)
        if session and not session.revoked_at:
            session.revoked_at = datetime.utcnow()
            if reason:
                session.revoked_reason = reason
            
            await self.session.add(session)
            await self.session.commit()
            await self.session.refresh(session)
            return True
        return False

    async def revoke_all_sessions(self, user_id: UUID, reason: str = "User logout") -> int:
        """
        Revoke all active sessions for a user (e.g., Change Password / Logout All).
        """
        stmt = update(UserSession).where(
            and_(
                UserSession.user_id == user_id,
                UserSession.revoked_at.is_(None)
            )
        ).values(
            revoked_at=datetime.utcnow(),
            revoked_reason=reason
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount

    async def cleanup_expired(self) -> int:
        """
        Hard delete sessions expired more than 7 days ago to save space.
        """
        stmt = delete(UserSession).where(
            UserSession.expires_at < datetime.utcnow() - timedelta(days=7)
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount