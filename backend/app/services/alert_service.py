"""
Alert monitoring service
"""
import asyncio
from datetime import datetime
from typing import Dict, Optional

from app.services.gemini_client import GeminiClient
from app.services.watcher import AlertWatcher
from app.services.scheduler import AdaptiveScheduler
from app.services.cricket_service import cricket_service
from app.services.storage import file_storage
from app.services.websocket_manager import websocket_manager
from app.core.config import settings
from app.models.enums import AlertType, MonitorStatus
from app.models.websocket_types import WebSocketMessageType


class AlertService:
    """Service for managing alert monitors"""

    def __init__(self):
        self.active_monitors: Dict[str, dict] = {}
        self.gemini_client = GeminiClient()
        self._restore_monitors()

    async def _broadcast_monitor_update(self, monitor_id: str):
        """Broadcast full monitor update via WebSocket"""
        monitor = self.get_monitor(monitor_id)
        if monitor:
            await websocket_manager.broadcast_to_monitor(
                monitor_id,
                {"type": WebSocketMessageType.MONITOR_UPDATE, "data": monitor},
            )

    async def _broadcast_new_alert(self, monitor_id: str, alert: dict):
        """Broadcast new alert via WebSocket"""
        await websocket_manager.broadcast_to_monitor(
            monitor_id,
            {
                "type": WebSocketMessageType.NEW_ALERT,
                "data": {"monitor_id": monitor_id, "alert": alert},
            },
        )

    async def _broadcast_status_change(
        self, monitor_id: str, status: str, running: bool = None
    ):
        """Broadcast status change via WebSocket"""
        data = {"monitor_id": monitor_id, "status": status}
        if running is not None:
            data["running"] = running

        await websocket_manager.broadcast_to_monitor(
            monitor_id, {"type": WebSocketMessageType.STATUS_CHANGE, "data": data}
        )

    async def _broadcast_expected_next_check(
        self, monitor_id: str, expected_next_check: dict
    ):
        """Broadcast expected next check update via WebSocket"""
        await websocket_manager.broadcast_to_monitor(
            monitor_id,
            {
                "type": WebSocketMessageType.EXPECTED_NEXT_CHECK_UPDATE,
                "data": {
                    "monitor_id": monitor_id,
                    "expectedNextCheck": expected_next_check,
                },
            },
        )

    def _restore_monitors(self):
        """Restore monitors from file storage on startup"""
        try:
            stored_monitors = file_storage.get_all_monitors()
            for monitor_id, monitor_data in stored_monitors.items():
                # Recreate watcher and scheduler
                watcher = AlertWatcher(
                    system_prompt_path=str(settings.PROMPTS_DIR / "system-prompt.md"),
                    user_prompt_path=str(settings.PROMPTS_DIR / "user-prompt.md"),
                )
                scheduler = AdaptiveScheduler()

                # Load alerts from storage
                alerts = file_storage.get_alerts(monitor_id)

                # Restore monitor in memory
                # Preserve running state for monitors that were actively monitoring
                was_running = monitor_data.get("running", False)
                should_restart = was_running and monitor_data.get("status") in [
                    MonitorStatus.MONITORING.value,
                    MonitorStatus.APPROACHING.value,
                    MonitorStatus.IMMINENT.value,
                ]

                self.active_monitors[monitor_id] = {
                    **monitor_data,
                    "watcher": watcher,
                    "scheduler": scheduler,
                    "alerts": alerts,
                    "running": False,  # Will be set to True when restarted
                    "should_restart": should_restart,
                }

                status = "(will restart)" if should_restart else "(stopped)"
                print(f"📥 Restored monitor {monitor_id} {status}")
        except Exception as e:
            print(f"⚠️  Error restoring monitors: {e}")

    def get_monitors_to_restart(self) -> list:
        """Get list of monitor IDs that should be restarted"""
        return [
            monitor_id
            for monitor_id, monitor in self.active_monitors.items()
            if monitor.get("should_restart", False)
        ]

    def create_monitor(self, match_id: int, alert_text: str) -> Dict:
        """Create a new alert monitor in initializing state"""
        # Create monitor ID
        monitor_id = f"{match_id}_{int(datetime.now().timestamp() * 1000)}"

        # Initialize components
        watcher = AlertWatcher(
            system_prompt_path=str(settings.PROMPTS_DIR / "system-prompt.md"),
            user_prompt_path=str(settings.PROMPTS_DIR / "user-prompt.md"),
        )
        scheduler = AdaptiveScheduler()

        # Store monitor with initializing status (rules will be parsed in background)
        self.active_monitors[monitor_id] = {
            "match_id": match_id,
            "alert_text": alert_text,
            "rules": None,
            "watcher": watcher,
            "scheduler": scheduler,
            "running": False,
            "status": MonitorStatus.INITIALIZING.value,
            "alerts": [],
            "expectedNextCheck": None,
            "created_at": datetime.now().isoformat(),
        }

        # Persist to file storage
        file_storage.save_monitor(monitor_id, self.active_monitors[monitor_id])

        return {
            "monitor_id": monitor_id,
            "match_id": match_id,
            "alert_text": alert_text,
            "rules": None,
            "status": MonitorStatus.INITIALIZING.value,
            "message": "Monitor is being initialized, rule parsing in progress",
            "created_at": self.active_monitors[monitor_id]["created_at"],
        }

    def parse_rules_and_start_monitoring(self, monitor_id: str):
        """Parse alert rules and start monitoring (runs in background thread)"""
        if monitor_id not in self.active_monitors:
            return

        monitor = self.active_monitors[monitor_id]

        try:
            print(f"🔄 Parsing alert rule for {monitor_id}...")

            # Parse alert rule
            rules = self.gemini_client.parse_alert_rule(monitor["alert_text"])

            if not rules:
                # Failed to parse
                monitor["status"] = MonitorStatus.ERROR.value
                monitor["running"] = False
                file_storage.save_monitor(monitor_id, monitor)

                error_alert = {
                    "type": AlertType.INFO.value,
                    "entity_type": "system",
                    "message": "Could not parse alert rule. Please rephrase your alert.",
                    "context": {},
                    "timestamp": datetime.now().isoformat(),
                }
                monitor["alerts"].append(error_alert)
                file_storage.save_alert(monitor_id, error_alert)

                print(f"❌ Failed to parse rule for {monitor_id}")
                return

            # Update monitor with parsed rules
            monitor["rules"] = rules
            monitor["status"] = MonitorStatus.MONITORING.value
            monitor["running"] = True
            file_storage.save_monitor(monitor_id, monitor)

            print(f"✅ Successfully parsed rule for {monitor_id}")

            # Start monitoring (run async function in new event loop)
            asyncio.run(self.monitor_match(monitor_id))

        except Exception as e:
            print(f"❌ Error initializing monitor {monitor_id}: {e}")
            monitor["status"] = MonitorStatus.ERROR.value
            monitor["running"] = False
            file_storage.save_monitor(monitor_id, monitor)

    def get_monitor(self, monitor_id: str) -> Optional[Dict]:
        """Get monitor information"""
        if monitor_id not in self.active_monitors:
            return None

        monitor = self.active_monitors[monitor_id]
        alerts = monitor["alerts"]
        last_alert_message = alerts[-1].get("message") if alerts else None

        return {
            "monitor_id": monitor_id,
            "match_id": monitor["match_id"],
            "alert_text": monitor["alert_text"],
            "rules": monitor["rules"],
            "running": monitor["running"],
            "status": monitor.get("status", MonitorStatus.STOPPED.value),
            "created_at": monitor["created_at"],
            "alerts_count": len(alerts),
            "last_alert_message": last_alert_message,
            "expectedNextCheck": monitor.get("expectedNextCheck"),
            "recent_alerts": alerts[-10:],  # Last 10
        }

    def list_monitors(self):
        """List all monitors"""
        result = []
        for monitor_id, monitor in self.active_monitors.items():
            result.append(self.get_monitor(monitor_id))
        return result

    def get_monitors_by_match(self, match_id: int):
        """Get all monitors for a specific match"""
        result = []
        for monitor_id, monitor in self.active_monitors.items():
            if monitor.get("match_id") == match_id:
                result.append(self.get_monitor(monitor_id))
        return result

    def stop_monitor(self, monitor_id: str) -> bool:
        """Stop a monitor"""
        if monitor_id not in self.active_monitors:
            return False

        self.active_monitors[monitor_id]["running"] = False
        self.active_monitors[monitor_id]["status"] = MonitorStatus.STOPPED.value

        # Persist to file storage
        file_storage.save_monitor(monitor_id, self.active_monitors[monitor_id])

        return True

    def start_monitor(self, monitor_id: str) -> bool:
        """Start a stopped monitor (updates state, returns success)"""
        if monitor_id not in self.active_monitors:
            return False

        monitor = self.active_monitors[monitor_id]

        # Only allow starting if monitor is stopped or error
        if monitor["status"] not in [
            MonitorStatus.STOPPED.value,
            MonitorStatus.ERROR.value,
        ]:
            return False

        # Check if monitor has rules parsed
        if not monitor.get("rules"):
            return False

        monitor["running"] = True
        monitor["status"] = MonitorStatus.MONITORING.value

        # Persist to file storage
        file_storage.save_monitor(monitor_id, monitor)

        return True

    async def start_monitor_background(self, monitor_id: str):
        """Start monitoring in background"""
        asyncio.run(self.monitor_match(monitor_id))

    def delete_monitor(self, monitor_id: str) -> bool:
        """Delete a monitor"""
        if monitor_id not in self.active_monitors:
            return False

        self.active_monitors[monitor_id]["running"] = False
        self.active_monitors[monitor_id]["status"] = MonitorStatus.DELETED.value

        # Delete from file storage
        file_storage.delete_monitor(monitor_id)
        file_storage.delete_alerts(monitor_id)

        del self.active_monitors[monitor_id]
        return True

    async def monitor_match(self, monitor_id: str):
        """Background task to monitor a match"""
        if monitor_id not in self.active_monitors:
            return

        monitor = self.active_monitors[monitor_id]
        match_id = monitor["match_id"]
        watcher = monitor["watcher"]
        scheduler = monitor["scheduler"]

        print(f"🔍 Started monitoring {monitor_id}")

        while monitor["running"]:
            try:
                # Check if should poll
                if not scheduler.should_poll():
                    await asyncio.sleep(1)
                    continue

                # Fetch live data
                live_data = cricket_service.get_match_info(match_id)

                if not live_data:
                    await asyncio.sleep(60)
                    continue

                # Check if match ended
                match_header = live_data.get("matchHeader", {})
                if match_header.get("complete", False):
                    monitor["running"] = False
                    monitor["status"] = MonitorStatus.COMPLETED.value

                    end_alert = {
                        "type": AlertType.INFO.value,
                        "entity_type": "match",
                        "message": "Match has ended",
                        "context": {},
                        "timestamp": datetime.now().isoformat(),
                    }
                    monitor["alerts"].append(end_alert)

                    # Persist to file storage
                    file_storage.save_alert(monitor_id, end_alert)
                    file_storage.save_monitor(monitor_id, monitor)
                    break

                # Evaluate alerts
                result = watcher.evaluate(monitor["rules"], live_data)

                # Store alert if triggered (single alert object from LLM)
                if result:
                    # persist or merge expectedNextCheck at monitor level if provided
                    if "expectedNextCheck" in result:
                        # prefer the structure returned by the LLM
                        monitor["expectedNextCheck"] = result["expectedNextCheck"] or {}
                        # Persist updated expectedNextCheck
                        file_storage.save_monitor(monitor_id, monitor)

                        # Broadcast expectedNextCheck update via WebSocket
                        await self._broadcast_expected_next_check(
                            monitor_id, monitor["expectedNextCheck"]
                        )

                    if result.get("alert"):
                        alert = result["alert"]
                        # attach timestamp
                        alert["timestamp"] = datetime.now().isoformat()
                        monitor["alerts"].append(alert)

                        # Persist alert to file storage
                        file_storage.save_alert(monitor_id, alert)

                        alert_type = alert.get("type", "")
                        print(
                            f"🚨 Alert [{alert_type}]: {alert.get('message', 'No message')}"
                        )

                        # Broadcast new alert via WebSocket
                        await self._broadcast_new_alert(monitor_id, alert)

                        # Align monitor status with alert type
                        if alert_type == AlertType.TRIGGER.value:
                            # Target reached - stop monitoring
                            monitor["running"] = False
                            monitor["status"] = MonitorStatus.TRIGGERED.value
                            file_storage.save_monitor(monitor_id, monitor)
                            await self._broadcast_status_change(
                                monitor_id, MonitorStatus.TRIGGERED.value, running=False
                            )
                            print(f"✅ Monitor {monitor_id} triggered - target reached")
                            break

                        elif alert_type == AlertType.ABORTED.value:
                            # Cannot reach target anymore - stop monitoring
                            monitor["running"] = False
                            monitor["status"] = MonitorStatus.ABORTED.value
                            file_storage.save_monitor(monitor_id, monitor)
                            await self._broadcast_status_change(
                                monitor_id, MonitorStatus.ABORTED.value, running=False
                            )
                            print(
                                f"⏹️  Monitor {monitor_id} aborted - target unreachable"
                            )
                            break

                        elif alert_type == AlertType.SOFT_ALERT.value:
                            # Approaching target - continue monitoring
                            monitor["status"] = MonitorStatus.APPROACHING.value
                            file_storage.save_monitor(monitor_id, monitor)
                            await self._broadcast_status_change(
                                monitor_id, MonitorStatus.APPROACHING.value
                            )
                            print(f"📍 Monitor {monitor_id} approaching target")

                        elif alert_type == AlertType.HARD_ALERT.value:
                            # Very close to target - continue monitoring
                            monitor["status"] = MonitorStatus.IMMINENT.value
                            file_storage.save_monitor(monitor_id, monitor)
                            await self._broadcast_status_change(
                                monitor_id, MonitorStatus.IMMINENT.value
                            )
                            print(
                                f"🔥 Monitor {monitor_id} imminent - very close to target"
                            )

                # Update scheduler
                scheduler.mark_polled()
                if result and "expectedNextCheck" in result:
                    estimated_min = result["expectedNextCheck"].get("estimatedMinutes", 1)
                    scheduler.set_next_interval(min(estimated_min, 1))
                else:
                    scheduler.set_next_interval(1)

            except Exception as e:
                print(f"❌ Error in monitor {monitor_id}: {e}")
                # mark monitor as errored and stop
                monitor["running"] = False
                monitor["status"] = MonitorStatus.ERROR.value
                file_storage.save_monitor(monitor_id, monitor)
                await asyncio.sleep(60)

        print(f"⏹️  Monitor {monitor_id} stopped")


# Global service instance
alert_service = AlertService()
