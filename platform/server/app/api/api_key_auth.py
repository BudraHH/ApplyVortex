"""
Authentication dependency for API keys.
Allows agents to authenticate using X-API-Key header.
"""
import logging
from typing import Optional
from fastapi import Header, HTTPException, status, Depends, Request
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.core.dependencies import get_db
from app.models.user.user import User
from app.models.agent_api_key import AgentAPIKey
from app.utils.api_keys import verify_api_key, validate_api_key_format
from app.core.config import settings
from app.repositories.user.user_repository import UserRepository

logger = logging.getLogger(__name__)

async def get_current_user_from_api_key(
    x_api_key: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Authenticate user via API key from X-API-Key header.
    """
    if x_api_key:
        logger.info(f"DEBUG AUTH: Received key: {x_api_key[:10]}... (len: {len(x_api_key)})")
    else:
        logger.warning("DEBUG AUTH: No X-API-Key header received")
        return None
    
    # Validate format
    if not validate_api_key_format(x_api_key):
        logger.warning("DEBUG AUTH: Format validation failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key format"
        )
    
    # Find all active API keys
    stmt = select(AgentAPIKey).where(AgentAPIKey.is_active == True)
    result = await db.execute(stmt)
    api_keys = result.scalars().all()
    logger.info(f"DEBUG AUTH: Found {len(api_keys)} active keys in DB")
    
    # Check each key's hash
    matched_key = None
    for key_record in api_keys:
        if verify_api_key(x_api_key, key_record.key_hash):
            matched_key = key_record
            break
    
    if not matched_key:
        logger.warning("DEBUG AUTH: No matching key found in hash verification")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API key"
        )
    
    # Update last_used_at
    matched_key.last_used_at = datetime.utcnow()
    await db.commit()  # Await commit
    
    # Get user
    user = await db.get(User, matched_key.user_id)  # Await get
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user


async def get_authenticated_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
    api_key_user: Optional[User] = Depends(get_current_user_from_api_key)
) -> User:
    """
    Unified dependency that allows authentication via Bearer token (JWT) or API Key.
    First checks for API Key, then falls back to JWT.
    """
    # 1. If API key user was already found, use it
    if api_key_user:
        return api_key_user
        
    # 2. Check for JWT (Bearer Token)
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        # Check cookie as fallback
        token = request.cookies.get("access_token")
    else:
        token = auth_header.split(" ")[1]
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer or X-API-Key"},
        )
        
    # Validate JWT (simplified version of security.py logic)
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
            
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(status_code=401, detail="Invalid token payload")
            
        from uuid import UUID
        user_id = UUID(user_id_str)
        
        user_repo = UserRepository(db)
        user = await user_repo.get_by_id(user_id)
        
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found or inactive")
            
        return user
        
    except (JWTError, ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer or X-API-Key"},
        )
