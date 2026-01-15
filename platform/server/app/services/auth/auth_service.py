# app/services/auth/auth_service.py

from datetime import datetime, timedelta, timezone
from typing import Optional, Any
import secrets
import hashlib
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.hashing import verify_password, get_password_hash
from app.core.security import create_access_token
from app.constants.constants import AccountStatus, Gender, WorkMode, NotificationType
from app.models.user.user import User
from app.models.user.session import UserSession
from app.models.user.profile import UserProfile
from app.schemas.user.user import UserCreate
from app.schemas.auth.auth import TokenResponse, Token
from app.repositories.user.user_repository import UserRepository
from app.repositories.user.session_repository import SessionRepository
from app.core.exceptions import InvalidCredentials, AccountLocked
from app.core.config import settings


class AuthService:
    def __init__(
        self,
        db: AsyncSession,
        user_repo: Optional[UserRepository] = None,
        session_repo: Optional[SessionRepository] = None
    ):
        self.db = db
        self.user_repo = user_repo or UserRepository(db)
        self.session_repo = session_repo or SessionRepository(db)

    async def register(self, user_data: UserCreate) -> TokenResponse:
        """Register a new user and return tokens (Auto-Login)"""
        # Check if email is already registered
        if await self.user_repo.get_by_email(user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Create user
        hashed_password = get_password_hash(user_data.password)
        user_data_dict = user_data.model_dump(exclude={"password", "name"})
        # Update: Set email_verified=True and account_status=ACTIVE to skip verification
        user_data_dict.update({
            "password_hash": hashed_password,
            "email_verified": True,
            "account_status": AccountStatus.ACTIVE
        })
        
        user = await self.user_repo.create(user_data_dict)

        # Split full name into parts
        from app.utils.name_utils import split_full_name
        name_parts = split_full_name(user_data.name)

        # Create user profile with split name
        profile = UserProfile(
            user_id=user.id,
            first_name=name_parts["first_name"],
            middle_name=name_parts["middle_name"],
            last_name=name_parts["last_name"],
            # Required fields with default values
            gender=Gender.PREFER_NOT_TO_SAY,
            phone_number=None,
            phone_country_code="+91",
            current_city="Not Specified",
            preferred_work_mode=WorkMode.ONSITE,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        self.db.add(profile)
        user.profile = profile # Link profile to user object explicitly
        await self.db.flush() # Ensure profile is created before session

        # Auto-Login: Generate tokens and session
        refresh_token_raw = secrets.token_urlsafe(64)
        # Use SHA256 for deterministic hashing (fast lookup)
        refresh_token_hash = hashlib.sha256(refresh_token_raw.encode()).hexdigest()
        access_token_jti = secrets.token_urlsafe(16)

        # 1. Enforce Session Limit (5 sessions max)
        await self._enforce_session_limit(user.id)

        session = UserSession(
            user_id=user.id,
            refresh_token_hash=refresh_token_hash,
            access_token_jti=access_token_jti,
            user_agent="Auto-Login (Registration)",
            ip_address=None,
            device_name="Registration Device",
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        self.db.add(session)
        # Flush to ensure session ID is generated if needed, but primarily we need user_id which we have.
        # Commit to persist user, profile, and session.
        await self.db.commit()

        # Send Welcome Notification
        try:
            from app.repositories.user.notification_repository import NotificationRepository
            # from app.models.enums.notification_enums import NotificationType -> Removed
            
            notification_repo = NotificationRepository(self.db)
            await notification_repo.create_notification(
                user_id=user.id,
                type=NotificationType.SYSTEM,
                title="Welcome to ApplyVortex!",
                message="Complete your profile to start automating applications.",
                action_url="/profile-setup",
                metadata={"source": "registration"}
            )
            # Notification repo broadcasts it, but we need to commit the new notification record
            await self.db.commit()
        except Exception as e:
            # Don't fail registration if notification fails
            import logging
            logging.getLogger(__name__).error(f"Failed to send welcome notification: {e}")

        # Create access token with JTI
        access_token = create_access_token(
            {"sub": str(user.id), "email": user.email, "jti": access_token_jti}
        )
        
        
        # Refetch user to ensure relationships are loaded for response
        user = await self._ensure_user_loaded(user)

        return TokenResponse(
            token=Token(
                access_token=access_token,
                refresh_token=refresh_token_raw,
                token_type="bearer"
            ),
            user=self._create_user_response(user)
        )

    async def login(self, email: str, password: str, remember_me: bool = False, user_agent: str = None, ip_address: str = None) -> TokenResponse:
        """Authenticate user and create session"""
        user = await self.user_repo.get_by_email(email)
        
        # Check if user exists
        if not user:
            from app.core.exceptions import AuthException
            raise AuthException(detail="User not found")

        # Check if password is correct
        if not verify_password(password, user.password_hash):
            await self._handle_failed_login(user)
            from app.core.exceptions import AuthException
            raise AuthException(detail="Incorrect password entered")
            
        # Check if email is verified
        if not user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please verify your email before logging in"
            )
            
        if user.locked_until and user.locked_until > datetime.now(timezone.utc):
            raise AccountLocked()
            
        # Check if account is soft-deleted (within 30-day grace period)
        if user.deleted_at:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="ACCOUNT_SOFT_DELETED"
            )
            
        # Reset failed login attempts
        await self.user_repo.update(user.id, {
            "failed_login_attempts": 0,
            "last_login_at": datetime.now(timezone.utc),
            "last_login_ip": ip_address
        })
        
        # Generate tokens
        refresh_token_raw = secrets.token_urlsafe(64)
        # Use SHA256 for deterministic hashing (fast lookup)
        refresh_token_hash = hashlib.sha256(refresh_token_raw.encode()).hexdigest()
        access_token_jti = secrets.token_urlsafe(16)

        # Calculate expiry
        # If remember_me is True: 30 days
        # If False: 1 day (or default setting)
        expire_days = 30 if remember_me else settings.REFRESH_TOKEN_EXPIRE_DAYS
        expires_at = datetime.now(timezone.utc) + timedelta(days=expire_days)

        # Parse user agent to get device info
        from app.utils.user_agent_utils import generate_device_name
        from app.utils.geolocation_utils import get_location_from_ip
        
        device_name = generate_device_name(user_agent)
        location = await get_location_from_ip(ip_address)

        # 2. Enforce Session Limit (5 sessions max)
        await self._enforce_session_limit(user.id)

        # Create new session (allow multiple concurrent sessions)
        session = UserSession(
            user_id=user.id,
            refresh_token_hash=refresh_token_hash,
            access_token_jti=access_token_jti,
            user_agent=user_agent,
            ip_address=ip_address,
            device_name=device_name,
            country=location.get("country"),
            city=location.get("city"),
            expires_at=expires_at
        )
        self.db.add(session)
        await self.db.commit()
        
        # Create access token with JTI
        access_token = create_access_token(
            {"sub": str(user.id), "email": user.email, "jti": access_token_jti}
        )
        
        
        # Refetch user to ensure relationships are loaded for response
        user = await self._ensure_user_loaded(user)

        return TokenResponse(
            token=Token(
                access_token=access_token,
                refresh_token=refresh_token_raw,
                token_type="bearer"
            ),
            user=self._create_user_response(user)
        )

    async def _handle_failed_login(self, user: Optional[User]) -> None:
        """Handle failed login attempts and lock account if needed"""
        if not user:
            return
            
        max_attempts = settings.MAX_LOGIN_ATTEMPTS
        lock_time = settings.ACCOUNT_LOCK_TIME_MINUTES
        
        # Increment failed attempts
        new_attempts = user.failed_login_attempts + 1
        updates = {"failed_login_attempts": new_attempts}
        
        # Lock account if max attempts reached
        if new_attempts >= max_attempts:
            lock_until = datetime.now(timezone.utc) + timedelta(minutes=lock_time)
            updates.update({
                "locked_until": lock_until,
                "failed_login_attempts": 0  # Reset attempts after lock
            })
        
        await self.user_repo.update(user.id, updates)

    async def restore_account(self, email: str, password: str, user_agent: str = None, ip_address: str = None) -> TokenResponse:
        """Restore a soft-deleted account and log the user in"""
        user = await self.user_repo.get_by_email(email)
        
        if not user:
            from app.core.exceptions import AuthException
            raise AuthException(detail="User not found")

        if not verify_password(password, user.password_hash):
            from app.core.exceptions import AuthException
            raise AuthException(detail="Incorrect password")
            
        if not user.deleted_at:
            from app.core.exceptions import AuthException
            raise AuthException(detail="Account is not deleted")

        # Reactivate account
        from app.constants.constants import AccountStatus
        user.deleted_at = None
        user.is_active = True
        user.account_status = AccountStatus.ACTIVE.value
        
        # Generate tokens and session (same as login)
        refresh_token_raw = secrets.token_urlsafe(64)
        refresh_token_hash = hashlib.sha256(refresh_token_raw.encode()).hexdigest()
        access_token_jti = secrets.token_urlsafe(16)
        
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        from app.utils.user_agent_utils import generate_device_name
        from app.utils.geolocation_utils import get_location_from_ip
        device_name = generate_device_name(user_agent)
        location = await get_location_from_ip(ip_address)

        # 3. Enforce Session Limit (5 sessions max)
        await self._enforce_session_limit(user.id)

        session = UserSession(
            user_id=user.id,
            refresh_token_hash=refresh_token_hash,
            access_token_jti=access_token_jti,
            user_agent=user_agent,
            ip_address=ip_address,
            device_name=device_name,
            country=location.get("country"),
            city=location.get("city"),
            expires_at=expires_at
        )
        self.db.add(session)
        await self.db.commit()
        
        access_token = create_access_token(
            {"sub": str(user.id), "email": user.email, "jti": access_token_jti}
        )
        
        user = await self._ensure_user_loaded(user)
        return TokenResponse(
            token=Token(
                access_token=access_token,
                refresh_token=refresh_token_raw,
                token_type="bearer"
            ),
            user=self._create_user_response(user)
        )

    async def _generate_verification_token(self, user_id: str) -> str:
        """Generate and store email verification token"""
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        
        await self.user_repo.update(user_id, {
            "email_verification_token": token,
            "email_verification_token_expires_at": expires_at
        })
        
        return token

    async def verify_email(self, token: str) -> bool:
        """Verify user's email using the verification token"""
        user = await self.user_repo.get_by_verification_token(token)
        if not user:
            return False

        if user.email_verified:
            return True

        # Update user as verified
        await self.user_repo.update(user.id, {
            "email_verified": True,
            "account_status": "active",
            "email_verification_token": None,
            "email_verification_token_expires_at": None
        })

        return True

    async def refresh_token(self, refresh_token: str) -> TokenResponse:
        """Refresh access token using refresh token"""
        # HASHING: We must verify the provided opaque token against stored hashes.
        def hash_token(token: str) -> str:
            return hashlib.sha256(token.encode()).hexdigest()

        # Update logic: Use SHA256 for token lookup capability
        incoming_token_hash = hash_token(refresh_token)
        
        # Get session by refresh token hash
        session = await self.session_repo.get_by_refresh_token(incoming_token_hash)
        
        if not session or session.revoked_at or session.expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
            
        # Get user
        user = await self.user_repo.get_by_id(session.user_id)
        if not user or (not user.is_active and not user.deleted_at):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
            
        # Rotate Token: Generate new pair
        new_refresh_token_raw = secrets.token_urlsafe(64)
        new_refresh_token_hash = hash_token(new_refresh_token_raw)
        new_access_token_jti = secrets.token_urlsafe(16)
        
        # Update Session
        session.refresh_token_hash = new_refresh_token_hash
        session.access_token_jti = new_access_token_jti
        session.last_activity_at = datetime.now(timezone.utc)
        session.expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        self.db.add(session)
        await self.db.commit()
        
        # Create new access token
        access_token = create_access_token(
            {"sub": str(user.id), "email": user.email, "jti": new_access_token_jti}
        )
        
        
        # Refetch user to ensure relationships are loaded for response
        user = await self._ensure_user_loaded(user)

        return TokenResponse(
            token=Token(
                access_token=access_token,
                refresh_token=new_refresh_token_raw,
                token_type="bearer"
            ),
            user=self._create_user_response(user)
        )

    async def logout(self, refresh_token: str) -> None:
        """Revoke a refresh token (logout)"""
        # We need to hash to find the session
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        
        session = await self.session_repo.get_by_refresh_token(token_hash)
        if session:
            session.revoked_at = datetime.now(timezone.utc)
            await self.db.commit()

    async def _ensure_user_loaded(self, user: User) -> User:
        """Ensure relations are loaded to avoid MissingGreenlet"""
        # Use selectinload to fetch fresh object with props loaded (Async compatible)
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        
        stmt = (
            select(User)
            .options(
                selectinload(User.profile)
            )
            .where(User.id == user.id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()

    def _create_user_response(self, user: User) -> Any:
        """Helper to create UserResponse with Enum conversion"""
        from app.schemas.user.user import UserResponse
        
        # Determine name
        name = "Unknown"
        # Accessing profile is safe if eager loaded
        if user.profile:
            parts = [user.profile.first_name, user.profile.middle_name, user.profile.last_name]
            name = " ".join([p for p in parts if p]).strip() or "Unknown"
        elif user.name:
             name = user.name

        return UserResponse(
            id=user.id,
            email=user.email,
            name=name,
            email_verified=user.email_verified,
            account_status=user.account_status.value if hasattr(user.account_status, 'value') else str(user.account_status),
            is_active=user.is_active,
            role=user.role.value if hasattr(user.role, 'value') else str(user.role),
            subscription_plan=None,  # Subscription feature removed
            profile_completeness=0, 
            two_factor_enabled=user.two_factor_enabled,
            last_login_ip=str(user.last_login_ip) if user.last_login_ip else None,
            created_at=user.created_at,
            updated_at=user.updated_at
        )

    async def _enforce_session_limit(self, user_id: UUID) -> None:
        """
        Enforce the maximum number of concurrent sessions limit.
        If the limit is exceeded, revokes the oldest functional session(s).
        """
        from sqlalchemy import select, and_
        
        max_sessions = settings.MAX_SESSIONS_PER_USER
        
        # Query active sessions ordered by last activity (oldest first)
        query = (
            select(UserSession)
            .where(
                and_(
                    UserSession.user_id == user_id,
                    UserSession.revoked_at.is_(None),
                    UserSession.expires_at > datetime.now(timezone.utc)
                )
            )
            .order_by(UserSession.last_activity_at.asc())
        )
        
        result = await self.db.execute(query)
        active_sessions = result.scalars().all()
        
        # If we are at the limit, revoke the oldest to make room for the new one
        if len(active_sessions) >= max_sessions:
            # We want to have max_sessions - 1 sessions left so the incoming one makes it exactly max_sessions
            num_to_revoke = len(active_sessions) - max_sessions + 1
            for i in range(num_to_revoke):
                oldest = active_sessions[i]
                oldest.revoke(reason=f"Automatically logged out: session limit of {max_sessions} reached.")
                self.db.add(oldest)
            
            # Flush so it's reflected in the DB before the new session is added
            await self.db.flush()