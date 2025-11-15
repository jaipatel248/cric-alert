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
from app.core.config import settings
from app.models.enums import AlertType, MonitorStatus


class AlertService:
    """Service for managing alert monitors"""
    
    def __init__(self):
        self.active_monitors: Dict[str, dict] = {}
        self.gemini_client = GeminiClient()
    
    def create_monitor(self, match_id: int, alert_text: str) -> Optional[Dict]:
        """Create a new alert monitor"""
        try:
            # Parse alert rule
            rules = self.gemini_client.parse_alert_rule(alert_text)
            
            if not rules:
                return None
            
            # Create monitor ID
            monitor_id = f"{match_id}_{int(datetime.now().timestamp() * 1000)}"
            
            # Initialize components
            watcher = AlertWatcher(
                system_prompt_path=str(settings.PROMPTS_DIR / "system-prompt.md"),
                user_prompt_path=str(settings.PROMPTS_DIR / "user-prompt.md")
            )
            scheduler = AdaptiveScheduler()
            
            # Store monitor
            self.active_monitors[monitor_id] = {
                "match_id": match_id,
                "alert_text": alert_text,
                "rules": rules,
                "watcher": watcher,
                "scheduler": scheduler,
                "running": True,
                "status": MonitorStatus.MONITORING.value,
                "alerts": [],
                "created_at": datetime.now().isoformat()
            }
            
            return {
                "monitor_id": monitor_id,
                "match_id": match_id,
                "alert_text": alert_text,
                "rules": rules,
                "status": MonitorStatus.MONITORING.value,
                "message": "Monitor created successfully",
                "created_at": self.active_monitors[monitor_id]["created_at"]
            }
            
        except Exception as e:
            print(f"Error creating monitor: {e}")
            return None
    
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
            "recent_alerts": alerts[-10:]  # Last 10
        }
    
    def list_monitors(self):
        """List all monitors"""
        result = []
        for monitor_id, monitor in self.active_monitors.items():
            result.append(self.get_monitor(monitor_id))
        return result
    
    def stop_monitor(self, monitor_id: str) -> bool:
        """Stop a monitor"""
        if monitor_id not in self.active_monitors:
            return False
        
        self.active_monitors[monitor_id]["running"] = False
        self.active_monitors[monitor_id]["status"] = MonitorStatus.STOPPED.value
        return True
    
    def delete_monitor(self, monitor_id: str) -> bool:
        """Delete a monitor"""
        if monitor_id not in self.active_monitors:
            return False
        
        self.active_monitors[monitor_id]["running"] = False
        self.active_monitors[monitor_id]["status"] = MonitorStatus.DELETED.value
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
                    monitor["alerts"].append({
                        "type": AlertType.INFO.value,
                        "entity_type": "match",
                        "message": "Match has ended",
                        "context": {},
                        "timestamp": datetime.now().isoformat()
                    })
                    break
                
                # Evaluate alerts
                result = watcher.evaluate(monitor["rules"], live_data)
                
                # Store alert if triggered (single alert object from LLM)
                if result and result.get("alert"):
                    alert = result["alert"]
                    alert["timestamp"] = datetime.now().isoformat()
                    monitor["alerts"].append(alert)
                    
                    alert_type = alert.get('type', '')
                    print(f"🚨 Alert [{alert_type}]: {alert.get('message', 'No message')}")
                    
                    # Align monitor status with alert type
                    if alert_type == AlertType.TRIGGER.value:
                        # Target reached - stop monitoring
                        monitor["running"] = False
                        monitor["status"] = MonitorStatus.TRIGGERED.value
                        print(f"✅ Monitor {monitor_id} triggered - target reached")
                        break
                    elif alert_type == AlertType.ABORTED.value:
                        # Cannot reach target anymore - stop monitoring
                        monitor["running"] = False
                        monitor["status"] = MonitorStatus.ABORTED.value
                        print(f"⏹️  Monitor {monitor_id} aborted - target unreachable")
                        break
                    elif alert_type == AlertType.SOFT_ALERT.value:
                        # Approaching target - continue monitoring
                        monitor["status"] = MonitorStatus.APPROACHING.value
                        print(f"📍 Monitor {monitor_id} approaching target")
                    elif alert_type == AlertType.HARD_ALERT.value:
                        # Very close to target - continue monitoring
                        monitor["status"] = MonitorStatus.IMMINENT.value
                        print(f"🔥 Monitor {monitor_id} imminent - very close to target")
                
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
                await asyncio.sleep(60)
        
        print(f"⏹️  Monitor {monitor_id} stopped")


# Global service instance
alert_service = AlertService()
