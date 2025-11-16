"""
Gemini API client for natural language processing and alert evaluation
"""

import google.generativeai as genai
import json
from typing import Dict, Any, Optional
import os
from dotenv import load_dotenv

load_dotenv()


class GeminiClient:
    """Client for interacting with Gemini API"""

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")

        genai.configure(api_key=api_key)
        # Using gemini-2.5-flash for better availability and performance
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    def parse_alert_rule(self, user_text: str) -> Optional[Dict[str, Any]]:
        """
        Convert natural language alert into structured rule

        Args:
            user_text: User's alert description in natural language

        Returns:
            Structured rule dict or None on error
        """
        prompt = f"""Convert this cricket alert request into a structured JSON rule.

User request: {user_text}

Return ONLY a valid JSON object following this schema:

For milestone-based alerts:
{{
  "entity": "batter|bowler|team|partnership|innings|match",
  "selector": {{"name": "PlayerName", "teamShort": "TEAM"}},
  "milestones": [
    {{"kind": "fifty"}},
    {{"kind": "century"}},
    {{"kind": "absolute", "value": 150}},
    {{"kind": "multipleOf", "n": 50}},
    {{"kind": "wickets", "value": 5}},
    {{"kind": "economyBelow", "value": 3}}
  ],
  "windows": {{"approachWindow": 5, "hardWindow": 1}},
  "oncePerScope": "innings|match|false"
}}

For condition-based alerts:
{{
  "entity": "event|team|batter|bowler|match",
  "selector": {{"name": "PlayerName"}},
  "when": {{
    "anyOf": [
      {{"event": "WICKET"}},
      {{"textRegex": "comes to the crease"}},
      {{"stat": "bowler.wickets", "op": ">=", "value": 4}},
      {{"stat": "team.score", "op": ">=", "value": 300}}
    ]
  }},
  "oncePerScope": "over|innings|match|false"
}}

Return ONLY the JSON, no explanation."""

        try:
            response = self.model.generate_content(prompt)

            text = response.text.strip()
            print(f"Debug: Received response text: {text}")
            print(f"Debug: usage metadata: {response.usage_metadata}")

            # Clean up markdown code blocks if present
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()

            return json.loads(text)
        except Exception as e:
            print(f"Error parsing alert rule: {e}")
            return None

    def evaluate_alerts(
        self,
        rules: Dict[str, Any],
        live_data: Dict[str, Any],
        state: Dict[str, Any],
        system_prompt: str,
        user_prompt_template: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Evaluate alert rules against live data using Gemini

        Args:
            rules: Structured alert rules
            live_data: Live commentary JSON
            state: Current watcher state
            system_prompt: System prompt content
            user_prompt_template: User prompt template

        Returns:
            Alert response JSON or None on error
        """
        # Format the user prompt with actual data
        user_prompt = (
            user_prompt_template.replace(
                "{USER_ALERT_TEXT}", json.dumps(rules, indent=2)
            )
            .replace("{LIVE_JSON}", json.dumps(live_data, indent=2))
            .replace("{STATE}", json.dumps(state, indent=2))
        )

        # Combine system prompt and user prompt
        full_prompt = f"""{system_prompt}

---

{user_prompt}"""

        try:
            response = self.model.generate_content(full_prompt)
            text = response.text.strip()
            print(f"Debug: Evaluation response text: {text}")
            print(f"Debug: usage metadata: {response.usage_metadata}")

            # Clean up markdown code blocks if present
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()

            result = json.loads(text)
            return result
        except Exception as e:
            print(f"Error evaluating alerts: {e}")
            print(
                f"Response text: {response.text if 'response' in locals() else 'No response'}"
            )
            return None
