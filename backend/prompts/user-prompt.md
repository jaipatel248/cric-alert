User request: {USER_ALERT_TEXT}

Latest live commentary payload (strict JSON):
{LIVE_JSON}

Current watcher state (strict JSON):
{STATE}

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
    "estimatedOvers": <number>,
    "reasoning": "<string explanation of how this was estimated>"
  },
  "state": { ...updated deduplication and snapshot data... }
}

If no alert is triggered, return:
{
  "alert": null,
  "expectedNextCheck": {
    "estimatedMinutes": <number>,
    "reasoning": "no milestone nearby, default polling interval"
  },
  "state": { ...updated state... }
}

