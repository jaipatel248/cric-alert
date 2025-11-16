"""
Simple file-based storage for temporary data persistence.
This will be replaced with a proper database later.
"""
import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path
import threading


class FileStorage:
    """Simple JSON file-based storage"""

    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        self.monitors_file = self.data_dir / "monitors.json"
        self.alerts_file = self.data_dir / "alerts.json"
        self.lock = threading.Lock()
        
        # Initialize files if they don't exist
        self._init_files()

    def _init_files(self):
        """Initialize storage files"""
        if not self.monitors_file.exists():
            self._write_json(self.monitors_file, {})
        if not self.alerts_file.exists():
            self._write_json(self.alerts_file, {})

    def _read_json(self, file_path: Path) -> Dict:
        """Read JSON file safely"""
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def _write_json(self, file_path: Path, data: Dict):
        """Write JSON file safely"""
        # Write to temp file first, then rename for atomicity
        temp_file = file_path.with_suffix('.tmp')
        with open(temp_file, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        temp_file.replace(file_path)

    # Monitor operations
    def save_monitor(self, monitor_id: str, monitor_data: Dict):
        """Save or update a monitor"""
        with self.lock:
            monitors = self._read_json(self.monitors_file)
            
            # Remove non-serializable objects (watcher, scheduler)
            serializable_data = {
                "monitor_id": monitor_id,
                "match_id": monitor_data.get("match_id"),
                "alert_text": monitor_data.get("alert_text"),
                "rules": monitor_data.get("rules"),
                "running": monitor_data.get("running"),
                "status": monitor_data.get("status"),
                "created_at": monitor_data.get("created_at"),
                "expectedNextCheck": monitor_data.get("expectedNextCheck"),
                "updated_at": datetime.now().isoformat()
            }
            
            monitors[monitor_id] = serializable_data
            self._write_json(self.monitors_file, monitors)

    def get_monitor(self, monitor_id: str) -> Optional[Dict]:
        """Get a monitor by ID"""
        with self.lock:
            monitors = self._read_json(self.monitors_file)
            return monitors.get(monitor_id)

    def get_all_monitors(self) -> Dict[str, Dict]:
        """Get all monitors"""
        with self.lock:
            return self._read_json(self.monitors_file)

    def delete_monitor(self, monitor_id: str) -> bool:
        """Delete a monitor"""
        with self.lock:
            monitors = self._read_json(self.monitors_file)
            if monitor_id in monitors:
                del monitors[monitor_id]
                self._write_json(self.monitors_file, monitors)
                return True
            return False

    # Alert operations
    def save_alert(self, monitor_id: str, alert_data: Dict):
        """Save an alert for a monitor"""
        with self.lock:
            alerts = self._read_json(self.alerts_file)
            
            if monitor_id not in alerts:
                alerts[monitor_id] = []
            
            # Add timestamp if not present
            if "timestamp" not in alert_data:
                alert_data["timestamp"] = datetime.now().isoformat()
            
            alerts[monitor_id].append(alert_data)
            self._write_json(self.alerts_file, alerts)

    def get_alerts(self, monitor_id: str) -> List[Dict]:
        """Get all alerts for a monitor"""
        with self.lock:
            alerts = self._read_json(self.alerts_file)
            return alerts.get(monitor_id, [])

    def delete_alerts(self, monitor_id: str) -> bool:
        """Delete all alerts for a monitor"""
        with self.lock:
            alerts = self._read_json(self.alerts_file)
            if monitor_id in alerts:
                del alerts[monitor_id]
                self._write_json(self.alerts_file, alerts)
                return True
            return False

    def clear_all(self):
        """Clear all data (for testing)"""
        with self.lock:
            self._write_json(self.monitors_file, {})
            self._write_json(self.alerts_file, {})


# Global storage instance
file_storage = FileStorage()
