from typing import List, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import get_current_user, verify_token
from app.models.user.user import User
from app.repositories.user.notification_repository import NotificationRepository
from app.schemas.user.notification import NotificationResponse
from app.services.notification_manager import notification_manager

router = APIRouter()

@router.websocket("/ws")
async def websocket_notifications(
    websocket: WebSocket,
    token: str = Query(None)
):
    """
    WebSocket endpoint for real-time notifications.
    """
    # 1. Get Token (Query or Cookie)
    if not token:
        token = websocket.cookies.get("access_token")
        
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 2. Verify Token
    payload = verify_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 3. Extract User ID
    user_id_str = payload.get("sub")
    if not user_id_str:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    try:
        user_id = UUID(user_id_str)
    except ValueError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 4. Connect
    await notification_manager.connect(user_id, websocket)
    
    try:
        while True:
            # Keep connection alive. Client can send "ping" optionally.
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        notification_manager.disconnect(user_id, websocket)


@router.get("/", response_model=List[NotificationResponse])
async def get_my_notifications(
    skip: int = 0,
    limit: int = 20,
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> Any:
    """
    Get current user's notifications.
    """
    repo = NotificationRepository(session)
    return await repo.get_user_notifications(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        unread_only=unread_only
    )

@router.patch("/{notification_id}/read", response_model=bool)
async def mark_notification_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> Any:
    """
    Mark a specific notification as read.
    """
    repo = NotificationRepository(session)
    success = await repo.mark_as_read(notification_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    return True

@router.patch("/bulk-read", response_model=int)
async def mark_multiple_notifications_read(
    notification_ids: List[UUID],
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> Any:
    """
    Mark multiple notifications as read for current user.
    """
    repo = NotificationRepository(session)
    count = await repo.mark_multiple_as_read(notification_ids, current_user.id)
    return count

@router.patch("/read-all", response_model=int)
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> Any:
    """
    Mark all notifications as read for current user.
    """
    repo = NotificationRepository(session)
    count = await repo.mark_all_as_read(current_user.id)
    return count

@router.delete("/{notification_id}", response_model=bool)
async def delete_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> Any:
    """
    Delete a specific notification.
    """
    repo = NotificationRepository(session)
    success = await repo.delete_notification(notification_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    return True

@router.delete("/", response_model=int)
async def delete_all_notifications(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> Any:
    """
    Delete all notifications for current user.
    """
    repo = NotificationRepository(session)
    count = await repo.delete_all(current_user.id)
    return count
