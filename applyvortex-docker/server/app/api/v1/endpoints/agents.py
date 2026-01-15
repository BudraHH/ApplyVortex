"""
Agent Registration and Monitoring Endpoints (Enhanced with Phase 3 features)
"""
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from uuid import UUID

from app.core.dependencies import get_db
from app.models.user.user import User
from app.models.agent import Agent
from app.models.agent_api_key import AgentAPIKey
from app.models.agent_forge_task import AgentForgeTask
from app.api.api_key_auth import get_authenticated_user
from app.constants.constants import AgentStatus

router = APIRouter()


# Schemas
from app.schemas.agent import (
    AgentRegister, 
    AgentHeartbeat, 
    AgentMetrics, 
    AgentRateLimitUpdate, 
    AgentResponse
)


def check_rate_limit(agent: Agent) -> bool:
    """Check if agent has exceeded rate limit."""
    # Use naive UTC to match TIMESTAMP WITHOUT TIME ZONE column
    now = datetime.utcnow()
    
    # Handle potential timezone-aware datetime from DB or session
    reset_at = agent.rate_limit_reset_at
    if reset_at and reset_at.tzinfo:
        reset_at = reset_at.replace(tzinfo=None)
    
    # Initialize rate limit reset time if not set
    if not reset_at:
        agent.rate_limit_reset_at = now + timedelta(hours=1)
        return True
    
    # Reset counter if hour has passed
    if now >= reset_at:
        agent.tasks_this_hour = 0
        agent.rate_limit_reset_at = now + timedelta(hours=1)
    
    # Check limit
    return agent.tasks_this_hour < agent.max_tasks_per_hour


async def update_agent_metrics(db: AsyncSession, agent: Agent, task_status: str, execution_time: int = 0):
    """Update agent performance metrics after task completion."""
    if task_status == "COMPLETED":
        agent.total_tasks_completed += 1
    elif task_status == "FAILED":
        agent.total_tasks_failed += 1
    
    agent.total_execution_time_seconds += execution_time
    agent.last_task_completed_at = datetime.utcnow()
    
    # Compute success rate
    total = agent.total_tasks_completed + agent.total_tasks_failed
    if total > 0:
        agent.success_rate = (agent.total_tasks_completed / total) * 100
        agent.average_execution_time_seconds = agent.total_execution_time_seconds / total
    
    await db.commit()


@router.post("/register", response_model=AgentResponse)
async def register_agent(
    agent_data: AgentRegister,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_authenticated_user)
) -> Any:
    """
    Register a new agent or update existing agent.
    Links agent to the API key used for authentication.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required for agent registration"
        )
    
    # Find the API key used for this request
    stmt = select(AgentAPIKey).where(
        AgentAPIKey.user_id == current_user.id,
        AgentAPIKey.is_active == True
    ).order_by(AgentAPIKey.last_used_at.desc()).limit(1)
    
    result = await db.execute(stmt)
    api_key = result.scalars().first()
    
    # Check if agent already exists
    # Check if agent already exists
    stmt = select(Agent).where(Agent.agent_id == agent_data.agent_id)
    result = await db.execute(stmt)
    existing_agent = result.scalars().first()
    
    # Determine Hostname/Platform from system_info or top-level params
    hostname = agent_data.hostname
    platform_name = agent_data.platform
    
    if agent_data.system_info:
        if not hostname: hostname = agent_data.system_info.hostname
        if not platform_name: platform_name = f"{agent_data.system_info.os} {agent_data.system_info.os_release or ''}".strip()
    
    # Fallbacks
    if not hostname: hostname = "unknown-host"
    if not platform_name: platform_name = "unknown-os"

    if existing_agent:
        # Check if this agent belongs to the current user
        if existing_agent.user_id != current_user.id:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This agent is already registered to another user."
            )

        # Update existing agent
        existing_agent.hostname = hostname
        existing_agent.platform = platform_name
        existing_agent.version = agent_data.version
        existing_agent.name = agent_data.name or hostname
        existing_agent.status = AgentStatus.ONLINE.value
        existing_agent.last_heartbeat = datetime.utcnow()
        existing_agent.api_key_id = api_key.id if api_key else None
        await db.commit()
        await db.refresh(existing_agent)
        return existing_agent
    
    # Check for Single Agent Limit
    # Raise error if user has ANY other agent registered
    stmt = select(Agent).where(Agent.user_id == current_user.id)
    result = await db.execute(stmt)
    user_agents = result.scalars().all()
    
    if len(user_agents) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User limit reached: You can only have one active agent. Please delete your existing agent before registering a new one."
        )

    # Create new agent
    new_agent = Agent(
        agent_id=agent_data.agent_id,
        user_id=current_user.id,
        api_key_id=api_key.id if api_key else None,
        hostname=hostname,
        platform=platform_name,
        version=agent_data.version,
        name=agent_data.name or hostname,
        status=AgentStatus.ONLINE.value,
        last_heartbeat=datetime.utcnow(),
        rate_limit_reset_at=datetime.utcnow() + timedelta(hours=1)
    )
    
    db.add(new_agent)
    await db.commit()
    await db.refresh(new_agent)
    return new_agent


@router.post("/heartbeat", status_code=status.HTTP_200_OK)
async def agent_heartbeat(
    heartbeat_data: AgentHeartbeat,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_authenticated_user)
) -> Any:
    """
    Update agent heartbeat timestamp.
    Marks agent as online.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required"
        )
    
    # Find agent
    stmt = select(Agent).where(
        Agent.agent_id == heartbeat_data.agent_id,
        Agent.user_id == current_user.id
    )
    result = await db.execute(stmt)
    agent = result.scalars().first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found. Please register first."
        )
    
    # Update heartbeat
    agent.last_heartbeat = datetime.utcnow()
    agent.status = AgentStatus.ONLINE.value
    await db.commit()
    
    return {"message": "Heartbeat received"}


@router.get("/", response_model=List[AgentResponse])
async def list_agents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_authenticated_user)
) -> Any:
    """
    List all registered agents for the current user.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    stmt = select(Agent).where(
        Agent.user_id == current_user.id
    ).order_by(Agent.last_heartbeat.desc())
    
    result = await db.execute(stmt)
    agents = result.scalars().all()

    # Dynamic Online Check
    now = datetime.utcnow()
    updated = False
    for agent in agents:
        if agent.status in [AgentStatus.ONLINE.value, AgentStatus.BUSY.value]:
            # 1 minute threshold
            last_hb = agent.last_heartbeat
            if last_hb and last_hb.tzinfo:
                last_hb = last_hb.replace(tzinfo=None)
            
            if not last_hb or (now - last_hb) > timedelta(minutes=1):
                agent.status = AgentStatus.OFFLINE.value
                updated = True
    
    if updated:
        await db.commit()

    return agents


@router.get("/{agent_id}/metrics", response_model=AgentMetrics)
async def get_agent_metrics(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_authenticated_user)
) -> Any:
    """
    Get performance metrics for a specific agent.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    stmt = select(Agent).where(
        Agent.id == agent_id,
        Agent.user_id == current_user.id
    )
    result = await db.execute(stmt)
    agent = result.scalars().first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    return AgentMetrics(
        total_tasks_assigned=agent.total_tasks_assigned,
        total_tasks_completed=agent.total_tasks_completed,
        total_tasks_failed=agent.total_tasks_failed,
        success_rate=agent.success_rate,
        average_execution_time_seconds=agent.average_execution_time_seconds,
        last_task_completed_at=agent.last_task_completed_at
    )


@router.patch("/{agent_id}/rate-limit")
async def update_rate_limit(
    agent_id: str,
    rate_limit: AgentRateLimitUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_authenticated_user)
) -> Any:
    """
    Update rate limit for a specific agent.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    stmt = select(Agent).where(
        Agent.id == agent_id,
        Agent.user_id == current_user.id
    )
    result = await db.execute(stmt)
    agent = result.scalars().first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    agent.max_tasks_per_hour = rate_limit.max_tasks_per_hour
    await db.commit()
    
    return {"message": "Rate limit updated", "max_tasks_per_hour": agent.max_tasks_per_hour}


@router.get("/check-offline")
async def check_offline_agents(
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Background job endpoint: Mark agents as offline if no heartbeat for 2 minutes.
    Should be called by Celery task or cron job.
    """
    threshold = datetime.utcnow() - timedelta(minutes=5)
    
    stmt = select(Agent).where(
        Agent.status == AgentStatus.ONLINE.value,
        Agent.last_heartbeat < threshold
    )
    
    result = await db.execute(stmt)
    stale_agents = result.scalars().all()
    
    for agent in stale_agents:
        agent.status = AgentStatus.OFFLINE.value
    
    await db.commit()
    
    return {"marked_offline": len(stale_agents)}
