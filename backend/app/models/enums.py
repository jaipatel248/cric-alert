"""
Enums for alert types and monitor status
"""
from enum import Enum


class AlertType(str, Enum):
    """Alert types from LLM evaluation"""
    SOFT_ALERT = "SOFT_ALERT"  # Approaching target (within approach window)
    HARD_ALERT = "HARD_ALERT"  # Very close to target (one away)
    TRIGGER = "TRIGGER"         # Target reached/condition met
    ABORTED = "ABORTED"         # Cannot reach target anymore
    INFO = "INFO"               # Informational (e.g., match ended)


class MonitorStatus(str, Enum):
    """Monitor lifecycle status"""
    MONITORING = "monitoring"     # Active, no alerts yet
    APPROACHING = "approaching"   # Has SOFT_ALERT, still monitoring
    IMMINENT = "imminent"        # Has HARD_ALERT, very close to target
    TRIGGERED = "triggered"      # Target reached (TRIGGER alert)
    ABORTED = "aborted"          # Cannot reach target (ABORTED alert)
    COMPLETED = "completed"      # Match ended or manually stopped
    STOPPED = "stopped"          # Manually stopped by user
    ERROR = "error"              # Error occurred during monitoring
    DELETED = "deleted"          # Monitor deleted
