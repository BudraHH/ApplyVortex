# app/core/security.py

from datetime import datetime, timedelta, timezone
from typing import Optional, Union, Any
from jose import JWTError, jwt

from fastapi import Depends, HTTPException, status, Cookie
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_session
# from app.repositories.user.user_repository import UserRepository
from app.models.user.user import User

# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

# Password hashing functions moved to app.core.hashing

# This defines the token URL for Swagger UI authorization
# auto_error=False allows optional header (checks cookie fallback)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# --------------------------------------------------------------------------
# JWT Token Creation
# --------------------------------------------------------------------------

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a short-lived access token.
    Adds 'type': 'access' to the payload to prevent misuse as a refresh token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a long-lived refresh token.
    Adds 'type': 'refresh' to the payload.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


# --------------------------------------------------------------------------
# Token Validation
# --------------------------------------------------------------------------

def decode_token(token: str) -> dict:
    """
    Generic token decoding. Raises 401 if invalid.
    Useful for utility scripts or non-dependency contexts.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """
    Verifies token signature, expiration, and specific token type (access vs refresh).
    Returns None if invalid, to allow the caller to decide the Exception.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != token_type:
            return None
        return payload
    except JWTError:
        return None


# --------------------------------------------------------------------------
# FastAPI Dependencies
# --------------------------------------------------------------------------

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    access_token: Optional[str] = Cookie(None),
    session: AsyncSession = Depends(get_session)
) -> User:
    """
    Dependency to retrieve the current authenticated user from the Bearer token OR Cookie.
    Validates token, checks DB existence, and ensures account is active.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Use token from header OR cookie
    token_to_verify = token or access_token
    
    if token_to_verify is None:
        raise credentials_exception
    
    # Strip "Bearer " prefix if present (can happen if cookie was set with it or passed in header)
    if token_to_verify.startswith("Bearer "):
        token_to_verify = token_to_verify.replace("Bearer ", "", 1)
    
    # 1. Verify JWT format and signature
    payload = verify_token(token_to_verify, token_type="access")
    if payload is None:
        raise credentials_exception
    
    # 2. Extract User Identifier (user_id from sub field)
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
    
    try:
        from uuid import UUID
        user_id = UUID(user_id_str)
    except (ValueError, AttributeError):
        raise credentials_exception
    
    # 3. Retrieve User from Database by ID
    from app.repositories.user.user_repository import UserRepository
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_id)
    
    if user is None:
        raise credentials_exception
    
    # 4. Validate Session (check if revoked or expired)
    jti = payload.get("jti")  # JWT ID that links to session
    if jti:
        from app.repositories.user.session_repository import SessionRepository
        session_repo = SessionRepository(session)
        user_session = await session_repo.get_by_access_jti(jti)
        
        if user_session:
            # Check if session is revoked
            if user_session.revoked_at is not None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session has been revoked. Please log in again.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Check if session is expired
            if user_session.expires_at < datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session has expired. Please log in again.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
    
    # 5. Check Account Status
    if not user.is_active and not user.deleted_at:
        # Accounts that are inactive and NOT soft-deleted (e.g., pending or banned)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active"
        )
    
    # Note: Soft-deleted users (user.deleted_at is set) are allowed here 
    # so they can see the restoration modal and call the restore endpoint.
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency wrapper to ensure the user is active.
    (Redundant if get_current_user checks status, but good for explicit typing).
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user