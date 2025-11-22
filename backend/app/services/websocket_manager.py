"""
WebSocket connection manager for real-time alert updates
"""
from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    """Manages WebSocket connections for monitors"""

    def __init__(self):
        # Store active connections per monitor_id
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, monitor_id: str):
        """Accept and store a WebSocket connection"""
        await websocket.accept()
        if monitor_id not in self.active_connections:
            self.active_connections[monitor_id] = []
        self.active_connections[monitor_id].append(websocket)
        print(f"✅ WebSocket connected for monitor {monitor_id}")

    def disconnect(self, websocket: WebSocket, monitor_id: str):
        """Remove a WebSocket connection"""
        if monitor_id in self.active_connections:
            if websocket in self.active_connections[monitor_id]:
                self.active_connections[monitor_id].remove(websocket)
            if not self.active_connections[monitor_id]:
                del self.active_connections[monitor_id]
        print(f"❌ WebSocket disconnected for monitor {monitor_id}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific WebSocket connection"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Error sending WebSocket message: {e}")

    async def broadcast_to_monitor(self, monitor_id: str, message: dict):
        """Broadcast a message to all connections for a specific monitor"""
        if monitor_id not in self.active_connections:
            return

        disconnected = []
        for connection in self.active_connections[monitor_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to monitor {monitor_id}: {e}")
                disconnected.append(connection)

        # Clean up disconnected connections
        for connection in disconnected:
            self.disconnect(connection, monitor_id)

    async def broadcast_to_all(self, message: dict):
        """Broadcast a message to all active connections"""
        for monitor_id in list(self.active_connections.keys()):
            await self.broadcast_to_monitor(monitor_id, message)


# Global instance
websocket_manager = ConnectionManager()
