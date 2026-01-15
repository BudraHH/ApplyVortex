from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.user.user import User
from app.schemas.user.research import BulkResearchCreate, BulkResearchResponse
from app.services.user.research_service import ResearchService

router = APIRouter()


@router.get("", response_model=BulkResearchResponse)
async def get_research(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all research publications for the current user"""
    service = ResearchService(db)
    return await service.get_all(current_user.id)


@router.post("", response_model=BulkResearchResponse, status_code=status.HTTP_200_OK)
async def save_research(
    data: BulkResearchCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save/replace all research publications for the current user"""
    service = ResearchService(db)
    return await service.replace_all(current_user.id, data)
