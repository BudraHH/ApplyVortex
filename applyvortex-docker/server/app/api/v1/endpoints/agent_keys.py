"""
Agent API Key Management Endpoints
"""
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime
import secrets
import uuid

from app.core.dependencies import get_db, get_current_user
from app.core.config import settings
from app.models.user.user import User
from app.models.agent_api_key import AgentAPIKey
from app.utils.api_keys import hash_api_key

router = APIRouter()


# Schemas
class AgentAPIKeyCreate(BaseModel):
    name: str = "My Agent"  # Default name

class AgentConfig(BaseModel):
    api_key: str
    server_url: str
    poll_interval: int
    user_id: str
    device_id: str

class AgentAPIKeyCreateResponse(BaseModel):
    """Response when creating a new key"""
    api_key: str
    agent_config: AgentConfig
    installer_url: str
    
    class Config:
        from_attributes = True

class AgentAPIKeyListResponse(BaseModel):
    id: str
    name: str
    key_prefix: str
    device_id: str
    is_active: bool
    last_used_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.post("/generate", response_model=AgentAPIKeyCreateResponse, status_code=status.HTTP_201_CREATED)
async def generate_agent_key(
    key_data: AgentAPIKeyCreate,
    request: Request,
    os: str = "win", # Default to windows
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Generate a new API key and configuration for agent installation.
    """
    # Generate API Key: email_at_token
    sanitized_email = current_user.email.replace("@", "_at_")
    token = secrets.token_urlsafe(32)
    api_key = f"{sanitized_email}_{token}"
    
    # Generate Device ID
    device_id = uuid.uuid4()
    
    # Hash the key
    key_hash = hash_api_key(api_key)
    # Prefix is just the email part for identification
    key_prefix = sanitized_email 
    
    # Create record
    new_key = AgentAPIKey(
        user_id=current_user.id,
        device_id=device_id,
        key_hash=key_hash,
        key_prefix=key_prefix,
        name=key_data.name,
        is_active=True,
        install_path=None # Set by agent later if needed or via API Update
    )
    
    try:
        db.add(new_key)
        await db.commit()
        await db.refresh(new_key)
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate agent key: {str(e)}"
        )
    
    # Construct Config
    # If settings.BACKEND_CORS_ORIGINS contains localhost, use that loopback/public url
    # Use request.base_url or configured public URL
    server_url = str(request.base_url).rstrip("/")
    if "localhost" in server_url:
        server_url = "http://localhost:8000" # Force standard port if needed

    agent_config = AgentConfig(
        api_key=api_key,
        server_url=server_url,
        poll_interval=30,
        user_id=str(current_user.id),
        device_id=str(device_id)
    )
    
    # Determine installer URL based on OS parameter
    # In a real scenario, this might point to a signed S3 URL or a dynamic endpoint.
    # For now, we map to static files or a placeholder endpoint.
    
    installer_filename = "ApplyVortexAgent-Setup.exe" # Default Win
    if os == 'linux':
        installer_filename = "applyvortex-agent_1.0.0_amd64.deb"
    elif os == 'mac':
        installer_filename = "ApplyVortexAgent.dmg"
        
    # We can point to a new dedicated download endpoint if needed, or direct static
    # Let's use the pattern requested: /api/v1/agent-installer/{os}/{user_id}
    # But since we aren't building dynamic binaries yet, we will just point to the static file
    # for simplicity in this phase, OR use the requested URL structure if we implement the endpoint.
    
    # Using the requested structure:
    # installer_url = f"{server_url}/api/v1/agent-installer/{os}/{current_user.id}"
    
    # BUT, to make it work immediately with static files (Phase 4 suggestion):
    installer_url = f"{server_url}/static/installers/{installer_filename}"

    return AgentAPIKeyCreateResponse(
        api_key=api_key,
        agent_config=agent_config,
        installer_url=installer_url
    )


@router.get("/", response_model=List[AgentAPIKeyListResponse])
async def list_agent_keys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    List all registered agents/keys over.
    """
    stmt = select(AgentAPIKey).where(
        AgentAPIKey.user_id == current_user.id
    ).order_by(AgentAPIKey.created_at.desc())
    
    result = await db.execute(stmt)
    keys = result.scalars().all()
    
    # Convert UUIDs to strings for Pydantic
    return [
        AgentAPIKeyListResponse(
            id=str(k.id),
            name=k.name,
            key_prefix=k.key_prefix,
            device_id=str(k.device_id),
            is_active=k.is_active,
            last_used_at=k.last_used_at,
            created_at=k.created_at
        ) for k in keys
    ]


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_agent_key(
    key_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> None:
    """Revoke an agent key."""
    key = await db.get(AgentAPIKey, key_id)
    if not key or key.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Key not found")
        
    await db.delete(key)
    await db.commit()
