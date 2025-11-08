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
                "alerts": [],
                "created_at": datetime.now().isoformat()
            }
            
            return {
                "monitor_id": monitor_id,
                "match_id": match_id,
                "alert_text": alert_text,
                "rules": rules,
                "status": "active",
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
        return {
            "monitor_id": monitor_id,
            "match_id": monitor["match_id"],
            "alert_text": monitor["alert_text"],
            "rules": monitor["rules"],
            "running": monitor["running"],
            "created_at": monitor["created_at"],
            "alerts_count": len(monitor["alerts"]),
            "recent_alerts": monitor["alerts"][-10:]  # Last 10
        }
    
    def list_monitors(self):
        """List all monitors"""
        result = []
        for monitor_id, monitor in self.active_monitors.items():
            result.append({
                "monitor_id": monitor_id,
                "match_id": monitor["match_id"],
                "alert_text": monitor["alert_text"],
                "running": monitor["running"],
                "created_at": monitor["created_at"],
                "alerts_count": len(monitor["alerts"])
            })
        return result
    
    def stop_monitor(self, monitor_id: str) -> bool:
        """Stop a monitor"""
        if monitor_id not in self.active_monitors:
            return False
        
        self.active_monitors[monitor_id]["running"] = False
        return True
    
    def delete_monitor(self, monitor_id: str) -> bool:
        """Delete a monitor"""
        if monitor_id not in self.active_monitors:
            return False
        
        self.active_monitors[monitor_id]["running"] = False
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
                    monitor["alerts"].append({
                        "type": "INFO",
                        "entity_type": "match",
                        "message": "Match has ended",
                        "context": {},
                        "timestamp": datetime.now().isoformat()
                    })
                    break
                
                # Evaluate alerts
                result = watcher.evaluate(monitor["rules"], live_data)
                
                # Store new alerts
                if result and result.get("alerts"):
                    for alert in result["alerts"]:
                        alert["timestamp"] = datetime.now().isoformat()
                        monitor["alerts"].append(alert)
                        print(f"🚨 Alert: {alert['message']}")
                
                # Update scheduler
                scheduler.mark_polled()
                if result and "expectedNextCheck" in result:
                    estimated_min = result["expectedNextCheck"].get("estimatedMinutes", 1)
                    scheduler.set_next_interval(estimated_min)
                else:
                    scheduler.set_next_interval(1)
                
            except Exception as e:
                print(f"❌ Error in monitor {monitor_id}: {e}")
                await asyncio.sleep(60)
        
        print(f"⏹️  Monitor {monitor_id} stopped")


# Global service instance
alert_service = AlertService()
