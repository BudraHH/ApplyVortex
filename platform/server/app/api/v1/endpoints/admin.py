from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List
from app.schemas.system.log import SystemLogResponse

from app.core.dependencies import get_db, get_current_user
from app.models.user.user import User
from app.services.admin.admin_service import AdminService

router = APIRouter()

def get_admin_service(db: AsyncSession = Depends(get_db)) -> AdminService:
    return AdminService(db)

@router.get("/stats", response_model=Dict[str, Any])
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(get_admin_service)
):
    """
    Get aggregated statistics for the Super Admin Dashboard.
    Requires 'admin' or 'super-admin' role.
    """
    if current_user.role not in ["admin", "super-admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return await admin_service.get_dashboard_stats()

@router.get("/audit-logs", response_model=List[SystemLogResponse])
async def get_system_audit_logs(
    limit: int = 50,
    offset: int = 0,
    action: str = None,
    status: str = None,
    user_id: str = None,
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(get_admin_service)
):
    """
    Get paginated system audit logs.
    """
    if current_user.role not in ["admin", "super-admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return await admin_service.get_audit_logs(
        limit=limit,
        offset=offset,
        action=action,
        status=status,
        user_id=user_id
    )
