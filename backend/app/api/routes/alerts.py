"""
Alert monitoring endpoints
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
from app.models.schemas import (
    AlertRequest, 
    AlertResponse, 
    MonitorInfo, 
    MonitorDetail
)
from app.services.alert_service import alert_service
from app.services.cricket_service import cricket_service

router = APIRouter()


@router.post("", response_model=AlertResponse, status_code=201)
async def create_alert(request: AlertRequest, background_tasks: BackgroundTasks):
    """Create a new alert monitor"""
    try:
        # Verify match exists
        match_data = cricket_service.get_match_info(request.match_id)
        if not match_data:
            raise HTTPException(
                status_code=404,
                detail=f"Match {request.match_id} not found"
            )

        # Create monitor in initializing state
        result = alert_service.create_monitor(request.match_id, request.alert_text)

        # Parse rules and start monitoring in background
        monitor_id = result["monitor_id"]
        background_tasks.add_task(
            alert_service.parse_rules_and_start_monitoring, monitor_id
        )

        return AlertResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating alert: {str(e)}"
        )


@router.get("", response_model=List[MonitorInfo])
async def list_alerts():
    """List all active alert monitors"""
    monitors = alert_service.list_monitors()
    return [MonitorInfo(**m) for m in monitors]


@router.get("/{monitor_id}", response_model=MonitorDetail)
async def get_alert(monitor_id: str):
    """Get details of a specific alert monitor"""
    monitor = alert_service.get_monitor(monitor_id)

    if not monitor:
        raise HTTPException(
            status_code=404,
            detail=f"Monitor {monitor_id} not found"
        )

    return MonitorDetail(**monitor)


@router.put("/{monitor_id}/stop")
async def stop_alert(monitor_id: str):
    """Stop an alert monitor"""
    success = alert_service.stop_monitor(monitor_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Monitor {monitor_id} not found"
        )

    return {
        "monitor_id": monitor_id,
        "status": "stopped",
        "message": "Monitor stopped successfully"
    }


@router.put("/{monitor_id}/start")
async def start_alert(monitor_id: str, background_tasks: BackgroundTasks):
    """Start a stopped alert monitor"""
    success = alert_service.start_monitor(monitor_id)

    if not success:
        raise HTTPException(
            status_code=400,
            detail=f"Monitor {monitor_id} not found or cannot be started",
        )

    # Start monitoring in background
    background_tasks.add_task(alert_service.start_monitor_background, monitor_id)

    return {
        "monitor_id": monitor_id,
        "status": "monitoring",
        "message": "Monitor started successfully",
    }


@router.delete("/{monitor_id}/delete")
async def delete_alert(monitor_id: str):
    """Delete an alert monitor"""
    success = alert_service.delete_monitor(monitor_id)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Monitor {monitor_id} not found"
        )
    
    return {
        "monitor_id": monitor_id,
        "status": "deleted",
        "message": "Monitor deleted successfully"
    }
