User request: {USER_ALERT_TEXT}

Latest live commentary payload (strict JSON):
{LIVE_JSON}

Current watcher state (strict JSON):
{STATE}

Already triggered alerts (DO NOT trigger these again):
{TRIGGERED_ALERTS}

IMPORTANT: Check the triggered alerts list above. Do NOT generate any alert that matches an already triggered alert (same type, entity, and reason). Only generate new, unique alerts.

Return ONLY a valid JSON object in this format:
{
  "alert": {
    "type": "SOFT_ALERT|HARD_ALERT|TRIGGER|ABORTED",
    "entityType": "batter|bowler|team|partnership|innings|match|event|session",
    "entity": { "id": <int>, "name": "<string>", "teamShort": "<string>" },
    "inningsId": <int>,
    "matchId": <int>,
    "context": {
      "currentValue": <number>,
      "target": <number>,
      "runsToTarget": <number>,
      "ballNbr": <number>,
      "overNumber": <number>,
      "event": "<string>"
    },
    "reason": "within_window|one_away|reached|condition_met|aborted",
    "message": "<short human-readable summary>"
  },
  "expectedNextCheck": {
    "estimatedMinutes": <number>,
    "estimatedBalls": <number>,
    "reasoning": "<concise explanation with relevant stats>"
  },
  "state": { ...updated deduplication and snapshot data... }
}
