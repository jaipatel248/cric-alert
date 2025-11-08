"""
Match-related endpoints
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import MatchStatus, MatchDetail
from app.services.cricket_service import cricket_service

router = APIRouter()


@router.get("/{match_id}", response_model=MatchStatus)
async def get_match_status(match_id: int):
    """Get current match status"""
    try:
        status = cricket_service.get_match_status(match_id)
        
        if not status:
            raise HTTPException(
                status_code=404,
                detail=f"Match {match_id} not found or no data available"
            )
        
        return MatchStatus(**status)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching match status: {str(e)}"
        )


@router.get("/{match_id}/detail")
async def get_match_detail(match_id: int):
    """Get detailed match information"""
    try:
        data = cricket_service.get_match_info(match_id)
        
        if not data:
            raise HTTPException(
                status_code=404,
                detail=f"Match {match_id} not found"
            )
        
        match_header = data.get("matchHeader", {})
        team_info = match_header.get("matchTeamInfo", [])
        teams = [info.get("battingTeamShortName", "") for info in team_info]
        
        return {
            "match_id": match_id,
            "description": match_header.get("matchDescription", "Unknown"),
            "format": match_header.get("matchFormat", "Unknown"),
            "state": match_header.get("state", "Unknown"),
            "status": match_header.get("status", "Unknown"),
            "teams": teams,
            "miniscore": data.get("miniscore", {})
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching match details: {str(e)}"
        )


@router.get("/{match_id}/active")
async def check_match_active(match_id: int):
    """Check if match is currently active"""
    try:
        is_active = cricket_service.is_match_active(match_id)
        return {
            "match_id": match_id,
            "is_active": is_active
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error checking match status: {str(e)}"
        )
