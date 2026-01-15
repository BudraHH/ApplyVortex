from typing import List, Optional
from uuid import UUID
import logging
from fastapi import APIRouter, Depends, HTTPException, status

logger = logging.getLogger(__name__)
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user.user import User
from app.repositories.job.blueprint_repository import BlueprintRepository
from app.repositories.agent_task_repository import AgentTaskRepository
from app.schemas.job.blueprint import (
    BlueprintCreate,
    BlueprintUpdate,
    BlueprintResponse
)
from app.constants.constants import AgentTaskType

router = APIRouter()
@router.get("/relocation-context")
async def get_relocation_context(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch relocation preference and current city for the user."""
    from app.repositories.user.profile_repository import ProfileRepository
    repo = ProfileRepository(db)
    profile = await repo.get_by_user_id(current_user.id)
    
    if not profile:
        return {"relocation": True}
        
    if profile.willing_to_relocate:
        return {"relocation": True}
    else:
        return {
            "relocation": False, 
            "location": profile.current_city or "Unknown"
        }

@router.get("", response_model=List[BlueprintResponse])
async def get_blueprints(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all blueprints for the current user."""
    repo = BlueprintRepository(db)
    return await repo.get_by_user_id(current_user.id)

@router.get("/active", response_model=Optional[BlueprintResponse])
async def get_active_blueprint(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the primary active blueprint."""
    repo = BlueprintRepository(db)
    return await repo.get_active_by_user_id(current_user.id)

@router.post("", response_model=BlueprintResponse, status_code=status.HTTP_201_CREATED)
async def create_blueprint(
    profile_in: BlueprintCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new blueprint."""
    repo = BlueprintRepository(db)
    
    # Logic to deactivate others removed to allow multiple active blueprints


    profile = await repo.create(current_user.id, profile_in)
    await db.commit()
    await db.refresh(profile)
    return profile

@router.put("/{blueprint_id}", response_model=BlueprintResponse)
async def update_blueprint(
    blueprint_id: UUID,
    profile_in: BlueprintUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a blueprint."""
    repo = BlueprintRepository(db)
    profile = await repo.get(blueprint_id)
    
    if not profile:
        raise HTTPException(status_code=404, detail="Blueprint not found")
    if profile.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    logger.info(f"DEBUG: update_blueprint called for {blueprint_id} with payload: {profile_in}")
    
    # Logic to deactivate others removed to allow multiple active blueprints


    # Granular Cancellation Logic
    task_repo = AgentTaskRepository(db)
    
    from app.constants.constants import BlueprintStatus

    if profile_in.is_active is False:
        # Master kill switch
        logger.info(f"DEBUG: Blueprint {blueprint_id} deactivated. Cancelling ALL tasks.")
        await task_repo.cancel_active_tasks_for_blueprint(blueprint_id)
    elif profile_in.status is not None:
        # State transition logic
        if profile_in.status == BlueprintStatus.IDLE:
             logger.info(f"DEBUG: Blueprint {blueprint_id} set to IDLE. Cancelling ALL tasks.")
             await task_repo.cancel_active_tasks_for_blueprint(blueprint_id)
        elif profile_in.status == BlueprintStatus.AUTO_SCRAPE:
             logger.info(f"DEBUG: Blueprint {blueprint_id} set to SCRAPE. Cancelling Apply tasks.")
             await task_repo.cancel_active_tasks_for_blueprint(blueprint_id, task_type=AgentTaskType.AUTO_APPLY)
             await task_repo.cancel_active_tasks_for_blueprint(blueprint_id, task_type=AgentTaskType.APPLY)
        elif profile_in.status == BlueprintStatus.AUTO_APPLY:
             logger.info(f"DEBUG: Blueprint {blueprint_id} set to AUTO_APPLY. Cancelling Scrape tasks.")
             await task_repo.cancel_active_tasks_for_blueprint(blueprint_id, task_type=AgentTaskType.SCRAPE)

    updated = await repo.update(blueprint_id, profile_in)
    await db.commit()
    await db.refresh(updated)
    return updated

@router.delete("/{blueprint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blueprint(
    blueprint_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a blueprint."""
    repo = BlueprintRepository(db)
    profile = await repo.get(blueprint_id)
    
    if not profile:
        raise HTTPException(status_code=404, detail="Blueprint not found")
    if profile.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Cancel active tasks before deletion
    task_repo = AgentTaskRepository(db)
    await task_repo.cancel_active_tasks_for_blueprint(blueprint_id)
    
    await repo.delete(blueprint_id)
    await db.commit()
    return None
