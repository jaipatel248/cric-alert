"""
Health check endpoints
"""
from fastapi import APIRouter
from datetime import datetime
from app.models.schemas import HealthResponse
from app.core.config import settings
from app.services.alert_service import alert_service

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        active_monitors=len(alert_service.active_monitors),
        version=settings.VERSION
    )


@router.get("/ping")
async def ping():
    """Simple ping endpoint"""
    return {"message": "pong"}
