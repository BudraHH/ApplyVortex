from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Response, Request, Cookie, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_db, get_current_user, get_current_active_user, get_user_service, get_profile_service, get_complete_profile_service
from app.services.user.user import UserService
from app.services.profile.profile_service import ProfileService
from app.services.profile.complete_service import CompleteProfileService
from app.schemas.user.profile import ProfileResponse, ProfileCreate
from app.schemas.user.full_profile import FullProfileResponse
from app.models.user.user import User
from app.models.system.usage_credit import SystemUsageCredits
from app.models.system.system_log import SystemLog
from app.schemas.user.user import UserResponse, UserUpdate, UserListQuery, AdminUserCreate, UserStatsResponse, AdminNotesUpdate
from app.schemas.user.settings import AccountSettingsResponse, AccountSettingsUpdate, PasswordUpdate
from sqlalchemy import select, desc
import secrets
from datetime import datetime, timedelta, timezone
from app.core.config import settings
from app.core.security import create_access_token
from app.models.user.session import UserSession
from app.schemas.auth.auth import TokenResponse, Token
from app.constants.constants import AccountStatus
import hashlib

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
    db: AsyncSession = Depends(get_db)
):
    """Get current user profile with completeness score"""
    return await user_service.get_user_response(current_user)

@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service),
    db: AsyncSession = Depends(get_db)
):
    """Update current user (email, password, preferences)"""
    return await user_service.update_user(current_user.id, update_data)

@router.get("/me/profile", response_model=ProfileResponse)
async def get_current_user_profile_info(
    current_user: User = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service),
    db: AsyncSession = Depends(get_db)
):
    """Get current user profile details (name, headline, social links)"""
    return await profile_service.get_profile(current_user.id)

@router.post("/me/profile", response_model=ProfileResponse)
async def update_current_user_profile(
    profile_data: ProfileCreate,
    current_user: User = Depends(get_current_active_user),
    profile_service: ProfileService = Depends(get_profile_service),
    db: AsyncSession = Depends(get_db)
):
    """Update profile info (name, headline, social links, etc.)"""
    return await profile_service.update_profile(current_user.id, profile_data)

@router.get("/me/completeness")
async def get_profile_completeness(
    current_user: User = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service),
    db: AsyncSession = Depends(get_db)
):
    """Get profile completeness score (0-100)"""
    return {"completeness": await profile_service.calculate_completeness(current_user.id)}

@router.get("/me/full-profile", response_model=FullProfileResponse)
async def get_current_user_full_profile(
    current_user: User = Depends(get_current_user),
    complete_profile_service: CompleteProfileService = Depends(get_complete_profile_service)
):
    """Get Aggregated User Data for Agent Automation"""
    # Reuse the complete profile service logic but map to our response schema
    data = await complete_profile_service.get_complete_profile(current_user.id)
    
    # Ensure all list fields are lists (handle None from service if any)
    return FullProfileResponse(
        profile=data["profile"],
        education=data.get("educations", []),
        experience=data.get("experiences", []),
        projects=data.get("projects", []),
        certifications=data.get("certifications", []),
        accomplishments=data.get("accomplishments", []),
        research=data.get("research", []),
        languages=data.get("languages", []),
        skills=data.get("skills", []),
    )

@router.get("/me/account-settings", response_model=AccountSettingsResponse)
async def get_account_settings(
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    """Get aggregated account settings (user + profile)"""
    return await user_service.get_account_settings(current_user.id)


@router.patch("/me/account-settings", response_model=AccountSettingsResponse)
async def update_account_settings(
    update_data: AccountSettingsUpdate,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
    db: AsyncSession = Depends(get_db)
):
    """Update aggregated account settings"""
    # Ensure service has DB session
    if not user_service.db:
        user_service.db = db
        
    return await user_service.update_account_settings(current_user.id, update_data)


@router.post("/me/password")
async def update_password(
    password_data: PasswordUpdate,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
    db: AsyncSession = Depends(get_db)
):
    """Update user password"""
    # Ensure service has DB session
    if not user_service.db:
        user_service.db = db
    
    return await user_service.update_password(current_user.id, password_data.model_dump())


@router.get("/me/sessions")
async def get_user_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    access_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
):
    """Get all active sessions for the current user"""
    from app.services.user.session_service import SessionService
    from app.core.security import decode_token
    from app.repositories.user.session_repository import SessionRepository
    
    session_service = SessionService(db)
    
    # Extract JTI from current access token to get current session ID
    token = request.headers.get("Authorization")
    if token and token.startswith("Bearer "):
        token = token.replace("Bearer ", "", 1)
    elif access_token:
        token = access_token
    
    current_session_id = None
    if token:
        payload = decode_token(token)
        if payload:
            jti = payload.get("jti")
            if jti:
                session_repo = SessionRepository(db)
                current_session = await session_repo.get_by_access_jti(jti)
                if current_session:
                    current_session_id = str(current_session.id)
    
    return await session_service.get_user_sessions(current_user.id, current_session_id)


@router.delete("/me/sessions/{session_id}")
async def revoke_session(
    session_id: UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    access_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
):
    """Revoke a specific session (logout from a device)"""
    from app.services.user.session_service import SessionService
    from app.core.security import decode_token
    from app.repositories.user.session_repository import SessionRepository
    
    session_service = SessionService(db)
    
    # Extract JTI from current access token to get current session ID
    token = request.headers.get("Authorization")
    if token and token.startswith("Bearer "):
        token = token.replace("Bearer ", "", 1)
    elif access_token:
        token = access_token
    
    current_session_id = None
    if token:
        payload = decode_token(token)
        if payload:
            jti = payload.get("jti")
            if jti:
                session_repo = SessionRepository(db)
                current_session = await session_repo.get_by_access_jti(jti)
                if current_session:
                    current_session_id = current_session.id
    
    return await session_service.revoke_session(current_user.id, session_id, current_session_id)


@router.post("/me/sessions/revoke-all-others")
async def revoke_all_other_sessions (
    request: Request,
    current_user: User = Depends(get_current_user),
    access_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
):
    """Logout from all other devices (keep current session)"""
    from app.services.user.session_service import SessionService
    from app.core.security import decode_token
    
    session_service = SessionService(db)
    
    # Extract JTI from current access token
    token = request.headers.get("Authorization")
    if token and token.startswith("Bearer "):
        token = token.replace("Bearer ", "", 1)
    elif access_token:
        token = access_token
    
    current_session_id = None
    if token:
        payload = decode_token(token)
        if payload:
            jti = payload.get("jti")
            if jti:
                # Get session by JTI to get session ID
                from app.repositories.user.session_repository import SessionRepository
                session_repo = SessionRepository(db)
                current_session = await session_repo.get_by_access_jti(jti)
                if current_session:
                    current_session_id = current_session.id
    
    if not current_session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not identify current session"
        )
    
    return await session_service.revoke_all_other_sessions(current_user.id, current_session_id)


@router.delete("/me", response_model=dict)
@router.delete("/account", response_model=dict)
async def delete_account(
    response: Response,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Soft delete user account. 
    Sets deleted_at, is_active=False, and revokes all sessions.
    The account will be permanently deleted after 30 days.
    """
    from app.services.user.session_service import SessionService
    from app.constants.constants import AccountStatus
    
    # 1. Soft Delete
    current_user.deleted_at = datetime.now(timezone.utc)
    current_user.is_active = False
    current_user.account_status = AccountStatus.DEACTIVATED.value
    
    # 2. Revoke all sessions
    session_service = SessionService(db)
    await session_service.revoke_all_user_sessions(current_user.id)
    
    await db.commit()
    
    # 3. Send Warning Email (Background Task)
    from app.worker import send_deletion_warning_email
    send_deletion_warning_email.delay(current_user.email, current_user.profile.full_name if current_user.profile else "User")
    
    # 4. Clear Auth Cookies
    response.delete_cookie(key="refresh_token")
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="logged_in")
    
    return {
        "message": "Account deactivated. Your data will be permanently deleted in 30 days. You can restore your account by logging in before then."
    }


@router.post("/me/restore", response_model=dict)
@router.post("/account/restore", response_model=dict)
async def restore_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Restore a soft-deleted account.
    Only works if the account is within the 30-day grace period.
    Note: get_current_user dependency must allow soft-deleted users.
    """
    from app.constants.constants import AccountStatus
    
    if not current_user.deleted_at:
        return {"message": "Account is already active."}
        
    current_user.deleted_at = None
    current_user.is_active = True
    current_user.account_status = AccountStatus.ACTIVE.value
    
    await db.commit()
    
    return {"message": "Account restored successfully. Welcome back!"}
@router.get("/all-users", response_model=List[UserResponse])
async def list_all_users(
    query: UserListQuery = Depends(),
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
    db: AsyncSession = Depends(get_db)
):
    """Admin: List all users (paginated)"""
    if current_user.role not in ["admin", "super-admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return await user_service.list_users(query)

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_details_admin(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Get specific user details"""
    if current_user.role not in ["admin", "super-admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return await user_service.get_user(user_id)

@router.post("", response_model=UserResponse)
async def create_user_as_admin(
    user_data: AdminUserCreate,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Create new user manually"""
    if current_user.role not in ["admin", "super-admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return await user_service.create_user_admin(user_data)


@router.get("/{user_id}/stats", response_model=UserStatsResponse)
async def get_user_stats_admin(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Get user usage stats and activity"""
    if current_user.role not in ["admin", "super-admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")

    # Get User
    # Get User (Raw DB Model for stats access)
    user = await user_service.user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get Credits
    result = await db.execute(select(SystemUsageCredits).where(SystemUsageCredits.user_id == user_id))
    usage = result.scalar_one_or_none()
    
    credits_remaining = 0
    credits_limit = 0
    resumes_gen = 0
    
    if usage:
        credits_remaining = usage.resumes_limit - usage.resumes_generated
        credits_limit = usage.resumes_limit
        resumes_gen = usage.resumes_generated

    # Get Recent Logs (Activity)
    logs_result = await db.execute(
        select(SystemLog)
        .where(SystemLog.user_id == user_id)
        .order_by(desc(SystemLog.created_at))
        .limit(5)
    )
    logs = logs_result.scalars().all()
    
    activity = [
        {
            "action": log.action,
            "status": log.status,
            "timestamp": log.created_at,
            "details": log.details
        } for log in logs
    ]

    return {
        "credits_remaining": credits_remaining,
        "credits_limit": credits_limit,
        "resumes_generated": resumes_gen,
        "last_active": user.last_login_at,
        "last_ip": str(user.last_login_ip) if user.last_login_ip else None,
        "signup_date": user.created_at,
        "recent_activity": activity
    }


@router.post("/{user_id}/notes")
async def update_admin_notes(
    user_id: UUID,
    note_data: AdminNotesUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Update internal notes for a user"""
    if current_user.role not in ["admin", "super-admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Direct DB update for simplicity
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.admin_notes = note_data.notes
    await db.commit()
    return {"message": "Notes updated successfully"}


@router.get("/{user_id}/logs", response_model=List[dict])
async def get_user_logs_admin(
    user_id: UUID,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Get user system logs"""
    if current_user.role not in ["admin", "super-admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.execute(
        select(SystemLog)
        .where(SystemLog.user_id == user_id)
        .order_by(desc(SystemLog.created_at))
        .offset(offset)
        .limit(limit)
    )
    logs = result.scalars().all()
    
    return [
        {
            "id": log.id,
            "action": log.action,
            "status": log.status,
            "ip_address": log.ip_address,
            "duration_ms": log.duration_ms,
            "created_at": log.created_at,
            "details": log.details
        } for log in logs
    ]


@router.post("/{user_id}/impersonate", response_model=TokenResponse)
async def impersonate_user(
    user_id: UUID,
    response: Response,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Generate auth tokens to impersonate a user"""
    if current_user.role not in ["admin", "super-admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")

    target_user = await user_service.get_user(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate tokens (Similar to AuthService.login)
    refresh_token_raw = secrets.token_urlsafe(64)
    refresh_token_hash = hashlib.sha256(refresh_token_raw.encode()).hexdigest()
    access_token_jti = secrets.token_urlsafe(16)

    # Create session
    session = UserSession(
        user_id=target_user.id,
        refresh_token_hash=refresh_token_hash,
        access_token_jti=access_token_jti,
        user_agent="Admin Impersonation",
        ip_address=None,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(session)
    await db.commit()
    
    # Create access token
    access_token = create_access_token(
        {"sub": str(target_user.id), "email": target_user.email, "jti": access_token_jti}
    )

    MAX_AGE_SECONDS = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

    # Set Cookies
    response.set_cookie(
        key="refresh_token", value=refresh_token_raw, httponly=True,
        secure=settings.ENVIRONMENT not in ["local", "development"], samesite="lax", max_age=MAX_AGE_SECONDS
    )
    response.set_cookie(
        key="access_token", value=access_token, httponly=True,
        secure=settings.ENVIRONMENT not in ["local", "development"], samesite="lax", max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    response.set_cookie(
        key="logged_in", value="true", httponly=False,
        secure=settings.ENVIRONMENT not in ["local", "development"], samesite="lax", max_age=MAX_AGE_SECONDS
    )

    return TokenResponse(
        token=Token(access_token=access_token, refresh_token=refresh_token_raw, token_type="bearer"),
        user=target_user
    )


class UserStatusUpdate(BaseModel):
    account_status: AccountStatus


@router.patch("/{user_id}/status")
async def update_user_status(
    user_id: UUID,
    status_data: UserStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Ban or Activate user"""
    if current_user.role not in ["admin", "super-admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.account_status = status_data.account_status
    await db.commit()
    
    return {"message": f"User status updated to {status_data.account_status}"}


class UserRoleUpdate(BaseModel):
    role: str


@router.patch("/{user_id}/role")
async def update_user_role(
    user_id: UUID,
    role_data: UserRoleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Change user role (Promote/Demote)"""
    if current_user.role not in ["super-admin"]: # Only super-admin usually changes roles, but sticking to request implies admins might too? 
        # Requirement: "Demote to User (Remove admin rights)". Let's allow admin if not modifying super-admin.
        if current_user.role != "admin" and current_user.role != "super-admin":
             raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.role = role_data.role
    await db.commit()
    
    return {"message": f"User role updated to {role_data.role}"}


@router.post("/{user_id}/reset-2fa")
async def reset_user_2fa(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Disable 2FA for a user (Reset)"""
    if current_user.role not in ["admin", "super-admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.two_factor_enabled = False
    user.two_factor_secret = None
    user.two_factor_backup_codes = None
    
    await db.commit()
    
    return {"message": "2FA has been disabled for this user"}
