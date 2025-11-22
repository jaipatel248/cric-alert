"""
WebSocket message types enum
"""
from enum import Enum


class WebSocketMessageType(str, Enum):
    """WebSocket message type constants"""
    MONITOR_UPDATE = "monitor_update"
    NEW_ALERT = "new_alert"
    STATUS_CHANGE = "status_change"
    EXPECTED_NEXT_CHECK_UPDATE = "expected_next_check_update"
    PONG = "pong"
