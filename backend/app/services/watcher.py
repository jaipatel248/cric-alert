"""
Alert watcher engine that monitors live data and triggers alerts
"""
from typing import Dict, Any, List, Optional
from app.services.gemini_client import GeminiClient
import json


class AlertWatcher:
    """Monitors live cricket data and evaluates alert conditions"""

    def __init__(self, system_prompt_path: str, user_prompt_path: str):
        """
        Initialize the watcher with prompt templates

        Args:
            system_prompt_path: Path to system prompt file
            user_prompt_path: Path to user prompt template file
        """
        self.gemini_client = GeminiClient()

        # Load prompts
        with open(system_prompt_path, "r") as f:
            self.system_prompt = f.read()

        with open(user_prompt_path, "r") as f:
            self.user_prompt_template = f.read()

        # In-memory state storage
        self.state: Dict[str, Any] = {"lastAlerted": {}, "snapshots": {}}

    def parse_user_alert(self, alert_text: str) -> Optional[Dict[str, Any]]:
        """
        Parse natural language alert into structured rules

        Args:
            alert_text: User's alert description

        Returns:
            Structured rule or None
        """
        return self.gemini_client.parse_alert_rule(alert_text)

    def evaluate(
        self, rules: Dict[str, Any], live_data: Dict[str, Any], triggered_alert_messages: List[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Evaluate alert rules against live data

        Args:
            rules: Structured alert rules
            live_data: Live commentary data
            triggered_alert_messages: List of already triggered alert messages to avoid duplicates

        Returns:
            Alert response with any triggered alerts
        """
        result = self.gemini_client.evaluate_alerts(
            rules=rules,
            live_data=live_data,
            state=self.state,
            system_prompt=self.system_prompt,
            user_prompt_template=self.user_prompt_template,
            triggered_alert_messages=triggered_alert_messages or [],
        )

        if result and "state" in result:
            # Update in-memory state
            self.state = result["state"]

        return result

    def reset_state(self):
        """Reset the watcher state"""
        self.state = {"lastAlerted": {}, "snapshots": {}}

    def get_next_check_delay(self, alert_response: Dict[str, Any]) -> int:
        """
        Extract next check delay from alert response

        Args:
            alert_response: Response from evaluate()

        Returns:
            Delay in seconds (default 60)
        """
        if not alert_response:
            return 60

        expected = alert_response.get("expectedNextCheck", {})

        # Convert minutes to seconds, default to 60 seconds
        if "estimatedMinutes" in expected:
            return int(expected["estimatedMinutes"] * 60)

        # Fallback to default
        return 60

    def format_alerts(self, alert_response: Dict[str, Any]) -> List[str]:
        """
        Format alerts for display

        Args:
            alert_response: Response from evaluate()

        Returns:
            List of formatted alert messages
        """
        if not alert_response or not alert_response.get("alerts"):
            return []

        messages = []
        for alert in alert_response["alerts"]:
            msg = f"🚨 {alert['type']}: {alert.get('message', 'Alert triggered')}"
            messages.append(msg)

        return messages
