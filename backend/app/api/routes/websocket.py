"""
WebSocket routes for real-time updates
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.websocket_manager import websocket_manager
from app.services.alert_service import alert_service
from app.models.websocket_types import WebSocketMessageType

router = APIRouter()


async def send_message(websocket: WebSocket, message_type: WebSocketMessageType, data=None):
    """Helper to send WebSocket message"""
    message = {"type": message_type}
    if data is not None:
        message["data"] = data
    await websocket_manager.send_personal_message(message, websocket)


@router.websocket("/ws/{monitor_id}")
async def websocket_endpoint(websocket: WebSocket, monitor_id: str):
    """
    WebSocket endpoint for real-time monitor updates
    
    Clients connect to this endpoint with their monitor_id to receive:
    - Real-time alert updates
    - Monitor status changes
    - Expected next check updates
    """
    await websocket_manager.connect(websocket, monitor_id)
    
    try:
        # Send initial monitor state
        monitor = alert_service.get_monitor(monitor_id)
        if monitor:
            await send_message(websocket, WebSocketMessageType.MONITOR_UPDATE, monitor)
        
        # Keep connection alive and handle incoming messages
        while True:
            # Wait for messages from client (e.g., ping/pong for keepalive)
            data = await websocket.receive_text()
            
            # Echo back or handle specific commands if needed
            if data == "ping":
                await send_message(websocket, WebSocketMessageType.PONG)
            elif data == "refresh":
                # Send current monitor state
                monitor = alert_service.get_monitor(monitor_id)
                if monitor:
                    await send_message(websocket, WebSocketMessageType.MONITOR_UPDATE, monitor)
    
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket, monitor_id)
    except Exception as e:
        print(f"WebSocket error for monitor {monitor_id}: {e}")
        websocket_manager.disconnect(websocket, monitor_id)
