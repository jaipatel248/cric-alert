"""
Firebase Realtime Database storage for data persistence.
"""

import os
from datetime import datetime
from typing import Dict, List, Optional
import threading
import firebase_admin
from firebase_admin import credentials, db


class FirebaseStorage:
    """Firebase Realtime Database storage"""

    def __init__(self):
        self.lock = threading.Lock()

        # Read from environment variables
        database_url = os.getenv("FIREBASE_DATABASE_URL")
        credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

        # Initialize Firebase Admin SDK
        if not firebase_admin._apps:
            # Initialize with credentials if provided
            if credentials_path and os.path.exists(credentials_path):
                cred = credentials.Certificate(credentials_path)
                firebase_admin.initialize_app(cred, {"databaseURL": database_url})
            else:
                # Initialize without credentials for public database access
                firebase_admin.initialize_app(options={"databaseURL": database_url})

        self.monitors_ref = db.reference("monitors")
        self.alerts_ref = db.reference("alerts")

    # Monitor operations
    def save_monitor(self, monitor_id: str, monitor_data: Dict):
        """Save or update a monitor"""
        with self.lock:
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

            self.monitors_ref.child(monitor_id).set(serializable_data)

    def get_monitor(self, monitor_id: str) -> Optional[Dict]:
        """Get a monitor by ID"""
        with self.lock:
            data = self.monitors_ref.child(monitor_id).get()
            return data if data else None

    def get_all_monitors(self) -> Dict[str, Dict]:
        """Get all monitors"""
        with self.lock:
            data = self.monitors_ref.get()
            return data if data else {}

    def delete_monitor(self, monitor_id: str) -> bool:
        """Delete a monitor"""
        with self.lock:
            monitor = self.monitors_ref.child(monitor_id).get()
            if monitor:
                self.monitors_ref.child(monitor_id).delete()
                return True
            return False

    # Alert operations
    def save_alert(self, monitor_id: str, alert_data: Dict):
        """Save an alert for a monitor"""
        with self.lock:
            # Add timestamp if not present
            if "timestamp" not in alert_data:
                alert_data["timestamp"] = datetime.now().isoformat()

            # Push new alert to the list
            self.alerts_ref.child(monitor_id).push(alert_data)

    def get_alerts(self, monitor_id: str) -> List[Dict]:
        """Get all alerts for a monitor"""
        with self.lock:
            data = self.alerts_ref.child(monitor_id).get()
            if not data:
                return []

            # Convert dict to list (Firebase returns dict with auto-generated keys)
            if isinstance(data, dict):
                return list(data.values())
            return data

    def delete_alerts(self, monitor_id: str) -> bool:
        """Delete all alerts for a monitor"""
        with self.lock:
            alerts = self.alerts_ref.child(monitor_id).get()
            if alerts:
                self.alerts_ref.child(monitor_id).delete()
                return True
            return False

    def clear_all(self):
        """Clear all data (for testing)"""
        with self.lock:
            self.monitors_ref.delete()
            self.alerts_ref.delete()


# Global storage instance
file_storage = FirebaseStorage()
