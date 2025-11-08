"""
API client for fetching live cricket commentary from Cricbuzz
"""

import requests
from typing import Dict, Any, Optional
import time


class CricbuzzAPIClient:
    """Client for Cricbuzz live commentary API"""

    BASE_URL = "https://www.cricbuzz.com/api/mcenter/comm"

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        )

    def get_live_commentary(self, match_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch live commentary for a given match ID

        Args:
            match_id: The match ID to fetch commentary for

        Returns:
            JSON response with commentary data or None on error
        """
        try:
            url = f"{self.BASE_URL}/{match_id}"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching commentary: {e}")
            return None
        except ValueError as e:
            print(f"Error parsing JSON response: {e}")
            return None

    def get_match_info(self, match_id: str) -> Optional[Dict[str, Any]]:
        """
        Extract match information from commentary payload

        Args:
            match_id: The match ID

        Returns:
            Extracted match info or None
        """
        data = self.get_live_commentary(match_id)
        if not data:
            return None

        return {
            "matchHeader": data.get("matchHeader", {}),
            "miniscore": data.get("miniscore", {}),
            "commentaryList": data.get("commentaryList", []),
            "matchId": match_id,
            "timestamp": time.time(),
        }
