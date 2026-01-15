from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List
from app.core.dependencies import get_db, get_current_user, get_intelligence_service
from app.models.user.user import User
from app.services.intelligence.intelligence_service import IntelligenceService

router = APIRouter()

@router.get("/optimization")
async def get_optimization(
    current_user: User = Depends(get_current_user),
    intelligence_service: IntelligenceService = Depends(get_intelligence_service)
):
    """
    Intelligence engine diagnostics and profile optimization signals.
    
    Returns real data based on user's job match analysis:
    - score: Optimization score (0-100) based on match quality
    - salaryBoost: Estimated salary increase potential
    - skillGaps: Prioritized list of missing skills with impact estimates
    
    If no job matches exist, returns empty state with guidance message.
    """
    return await intelligence_service.get_optimization_insights(current_user.id)

