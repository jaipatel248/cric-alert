"""
Cricket data service
"""
from typing import Optional, Dict, Any
from app.services.api_client import CricbuzzAPIClient


class CricketService:
    """Service for cricket match data"""
    
    def __init__(self):
        self.api_client = CricbuzzAPIClient()
    
    def get_match_info(self, match_id: int) -> Optional[Dict[str, Any]]:
        """Get match information"""
        return self.api_client.get_match_info(str(match_id))
    
    def get_match_status(self, match_id: int) -> Optional[Dict[str, Any]]:
        """Get simplified match status"""
        data = self.get_match_info(match_id)
        
        if not data:
            return None
        
        match_header = data.get("matchHeader", {})
        miniscore = data.get("miniscore", {})
        
        bat_team = miniscore.get("batTeam", {})
        
        return {
            "match_id": match_id,
            "state": match_header.get("state", "Unknown"),
            "status": match_header.get("status", "Unknown"),
            "score": f"{bat_team.get('teamScore', 0)}/{bat_team.get('teamWkts', 0)}",
            "overs": miniscore.get("overs", 0),
            "batting_team": miniscore.get("batTeam", {}).get("teamId"),
            "current_run_rate": miniscore.get("currentRunRate", 0)
        }
    
    def is_match_active(self, match_id: int) -> bool:
        """Check if match is currently active"""
        data = self.get_match_info(match_id)
        
        if not data:
            return False
        
        match_header = data.get("matchHeader", {})
        return not match_header.get("complete", False)


# Global service instance
cricket_service = CricketService()
