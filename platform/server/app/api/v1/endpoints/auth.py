# app/api/endpoints/auth.py

from fastapi import APIRouter, Depends, HTTPException, status, Request, Body, Response, Cookie, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from typing import Any, Optional

from app.schemas.user.user import UserCreate, UserLogin
from app.schemas.auth.auth import TokenResponse
from app.services.auth.auth_service import AuthService
from app.core.database import get_session
from app.core.config import settings

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
async def register(
    response: Response,
    request: Request, 
    user_data: UserCreate,
    db: AsyncSession = Depends(get_session)
):
    """Register a new user"""
    auth_service = AuthService(db)
    token_response = await auth_service.register(user_data)
    
    MAX_AGE_SECONDS = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    
    # Set Refresh Token Cookie
    response.set_cookie(
        key="refresh_token",
        value=token_response.token.refresh_token,
        httponly=True,
        secure=True, # Required for SameSite=None
        samesite="none",
        max_age=MAX_AGE_SECONDS
    )
    
    # Set Access Token Cookie
    response.set_cookie(
        key="access_token",
        value=token_response.token.access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    # Set Visible Flag Cookie (for Frontend Logic)
    response.set_cookie(
        key="logged_in",
        value="true",
        httponly=False, # Readable by JS
        secure=True,
        samesite="none",
        max_age=MAX_AGE_SECONDS
    )
    
    # Remove tokens from response body
    token_response.token.refresh_token = None
    token_response.token.access_token = None
    return token_response

@router.post("/login", response_model=TokenResponse)
async def login(
    response: Response,
    request: Request, 
    form_data: OAuth2PasswordRequestForm = Depends(),
    remember_me: bool = Form(False),
    db: AsyncSession = Depends(get_session)
):
    """User login with email and password"""
    auth_service = AuthService(db)
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    
    token_response = await auth_service.login(
        email=form_data.username,
        password=form_data.password,
        remember_me=remember_me,
        user_agent=user_agent,
        ip_address=ip_address
    )
    
    # Expiry Logic
    if remember_me:
        # 20 Days (User Request)
        MAX_AGE_SECONDS = 20 * 24 * 60 * 60
    else:
        # 24 Hours (User Request: Minimum time should be 24h)
        MAX_AGE_SECONDS = 24 * 60 * 60

    # Set Refresh Token Cookie
    response.set_cookie(
        key="refresh_token",
        value=token_response.token.refresh_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=MAX_AGE_SECONDS
    )

    # Set Access Token Cookie (Always short lived, e.g. 30 mins, but cookie validity follows session if remember_me is false? 
    # Actually access token cookie should probably expire with the token (30m). 
    # But if it expires, we refresh. The refresh token cookie is the one that matters for "Remember Me".
    # So we keep access token cookie max_age as is (30m).
    
    response.set_cookie(
        key="access_token",
        value=token_response.token.access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    # Set Visible Flag Cookie
    # This should match the refresh token persistence so UI knows we are "logged in" across restarts if remember_me is on.
    response.set_cookie(
        key="logged_in",
        value="true",
        httponly=False,
        secure=True,
        samesite="none",
        max_age=MAX_AGE_SECONDS
    )
    
    # Remove tokens from response body
    token_response.token.refresh_token = None
    token_response.token.access_token = None
    return token_response

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_session)
):
    """Refresh access token using refresh token"""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing"
        )
        
    # Strip "Bearer " prefix if present 
    if refresh_token.startswith("Bearer "):
        refresh_token = refresh_token.replace("Bearer ", "", 1)
        
    auth_service = AuthService(db)
    token_response = await auth_service.refresh_token(refresh_token)
    
    MAX_AGE_SECONDS = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

    # Rotate Refresh Token Cookie
    response.set_cookie(
        key="refresh_token",
        value=token_response.token.refresh_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=MAX_AGE_SECONDS
    )

    # Set Access Token Cookie
    response.set_cookie(
        key="access_token",
        value=token_response.token.access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    # Set Visible Flag Cookie
    response.set_cookie(
        key="logged_in",
        value="true",
        httponly=False,
        secure=True,
        samesite="none",
        max_age=MAX_AGE_SECONDS
    )
    
    token_response.token.refresh_token = None
    token_response.token.access_token = None
    return token_response

@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_session)
):
    """Logout user by revoking refresh token"""
    if refresh_token:
        auth_service = AuthService(db)
        await auth_service.logout(refresh_token)
    
    response.delete_cookie(key="refresh_token", secure=True, samesite="none")
    response.delete_cookie(key="access_token", secure=True, samesite="none")
    response.delete_cookie(key="logged_in", secure=True, samesite="none")
    return {"message": "Successfully logged out"}

@router.post("/verify-email", response_model=dict)
async def verify_email(
    token: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_session)
):
    """Verify user's email using verification token"""
    auth_service = AuthService(db)
    success = await auth_service.verify_email(token)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    return {"message": "Email verified successfully"}

@router.post("/restore", response_model=TokenResponse)
async def restore(
    response: Response,
    request: Request,
    user_data: UserLogin,
    db: AsyncSession = Depends(get_session)
):
    """Restore a soft-deleted account and log in"""
    auth_service = AuthService(db)
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    
    token_response = await auth_service.restore_account(
        email=user_data.email,
        password=user_data.password,
        user_agent=user_agent,
        ip_address=ip_address
    )
    
    # Set cookies (Standard logic)
    MAX_AGE_SECONDS = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    
    response.set_cookie(
        key="refresh_token",
        value=token_response.token.refresh_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=MAX_AGE_SECONDS
    )
    
    response.set_cookie(
        key="access_token",
        value=token_response.token.access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    response.set_cookie(
        key="logged_in",
        value="true",
        httponly=False,
        secure=True,
        samesite="none",
        max_age=MAX_AGE_SECONDS
    )
    
    token_response.token.refresh_token = None
    token_response.token.access_token = None
    return token_response