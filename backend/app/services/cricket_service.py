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

        # Prefer a human-friendly team name. miniscore may only include a numeric teamId,
        # while the MatchStatus schema expects a string. Try to resolve the shortName/name
        # from matchHeader (team1/team2) or matchTeamInfo. Fall back to the id string.
        team_name = bat_team.get("teamName") or bat_team.get("shortName")

        if not team_name:
            th_team1 = match_header.get("team1") or {}
            th_team2 = match_header.get("team2") or {}
            try:
                team_id = int(bat_team.get("teamId")) if bat_team.get("teamId") is not None else None
            except (ValueError, TypeError):
                team_id = None

            if team_id is not None:
                if th_team1.get("id") == team_id:
                    team_name = th_team1.get("shortName") or th_team1.get("name")
                elif th_team2.get("id") == team_id:
                    team_name = th_team2.get("shortName") or th_team2.get("name")

            if not team_name:
                mt_info = match_header.get("matchTeamInfo") or []
                for item in mt_info:
                    if item.get("battingTeamId") == team_id:
                        team_name = item.get("battingTeamShortName") or item.get("battingTeamName")
                        break

            if not team_name:
                team_name = str(team_id) if team_id is not None else None

        return {
            "match_id": match_id,
            "state": match_header.get("state", "Unknown"),
            "status": match_header.get("status", "Unknown"),
            "score": f"{bat_team.get('teamScore', 0)}/{bat_team.get('teamWkts', 0)}",
            "overs": miniscore.get("overs", 0),
            "batting_team": team_name,
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
