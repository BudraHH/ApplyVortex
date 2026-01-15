from typing import Dict, List, Any
from uuid import UUID
from fastapi import WebSocket
import asyncio
import json

class NotificationManager:
    """
    Manages WebSocket connections for real-time notifications.
    """
    def __init__(self):
        # Store active connections: user_id -> List[WebSocket]
        self.active_connections: Dict[UUID, List[WebSocket]] = {}

    async def connect(self, user_id: UUID, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: UUID, websocket: WebSocket):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_user(self, user_id: UUID, message: Any):
        """
        Sends a message to all active connections for a specific user.
        Accepts dict/list (sent as JSON) or string.
        """
        if user_id in self.active_connections:
            # Convert dict/list to JSON string if needed
            if isinstance(message, (dict, list)):
                text_data = json.dumps(message, default=str)
            else:
                text_data = str(message)
                
            # Send to all user's connections
            # We iterate a copy of the list in case disconnects happen during iteration
            for connection in list(self.active_connections[user_id]):
                try:
                    await connection.send_text(text_data)
                except Exception:
                    # If send fails, assume disconnected and cleanup
                    self.disconnect(user_id, connection)


# Global instance
notification_manager = NotificationManager()
