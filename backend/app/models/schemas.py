"""
Pydantic models for request/response schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from app.models.enums import AlertType, MonitorStatus


class AlertRequest(BaseModel):
    """Request to create an alert"""
    match_id: int = Field(..., description="Cricbuzz match ID", example=119888)
    alert_text: str = Field(..., description="Alert description in natural language", 
                           example="Notify me when Virat Kohli is within 5 runs of a century")


class AlertResponse(BaseModel):
    """Response after creating an alert"""
    monitor_id: str
    match_id: int
    alert_text: str
    rules: Dict[str, Any]
    status: Literal["monitoring", "approaching", "imminent", "triggered", "aborted", "completed", "stopped", "error", "deleted"]
    message: str
    created_at: str


class MonitorInfo(BaseModel):
    """Information about an active monitor"""
    monitor_id: str
    match_id: int
    alert_text: str
    running: bool
    status: Literal["monitoring", "approaching", "imminent", "triggered", "aborted", "completed", "stopped", "error", "deleted"]
    created_at: str
    alerts_count: int
    last_alert_message: Optional[str] = None


class MonitorDetail(MonitorInfo):
    """Detailed monitor information including recent alerts"""
    rules: Dict[str, Any]
    recent_alerts: List[Dict[str, Any]]


class MatchStatus(BaseModel):
    """Current match status"""
    match_id: int
    state: str
    status: str
    score: Optional[str] = None
    overs: Optional[float] = None
    batting_team: Optional[str] = None
    current_run_rate: Optional[float] = None


class MatchDetail(BaseModel):
    """Detailed match information"""
    match_id: int
    description: str
    format: str
    state: str
    status: str
    teams: List[str]
    miniscore: Optional[Dict[str, Any]] = None


class Alert(BaseModel):
    """Alert information"""
    type: str
    entity_type: str
    message: str
    context: Dict[str, Any]
    timestamp: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: str
    active_monitors: int
    version: str


class ErrorResponse(BaseModel):
    """Error response"""
    detail: str
    timestamp: str
