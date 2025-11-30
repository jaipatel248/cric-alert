"""
Firestore database storage for data persistence.
"""

import os
from datetime import datetime
from typing import Dict, List, Optional
import threading
import firebase_admin
from firebase_admin import credentials, firestore


class FirestoreStorage:
    """Firestore database storage"""

    def __init__(self):
        self.lock = threading.Lock()

        # Read from environment variables
        credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

        # Initialize Firebase Admin SDK
        if not firebase_admin._apps:
            # Initialize with credentials if provided
            if credentials_path and os.path.exists(credentials_path):
                cred = credentials.Certificate(credentials_path)
                firebase_admin.initialize_app(cred)
            else:
                # Initialize with default credentials
                firebase_admin.initialize_app()

        self.db = firestore.client()
        self.monitors_collection = self.db.collection("monitors")

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

            self.monitors_collection.document(monitor_id).set(serializable_data)

    def get_monitor(self, monitor_id: str) -> Optional[Dict]:
        """Get a monitor by ID"""
        with self.lock:
            doc = self.monitors_collection.document(monitor_id).get()
            return doc.to_dict() if doc.exists else None

    def get_all_monitors(self) -> Dict[str, Dict]:
        """Get all monitors"""
        with self.lock:
            docs = self.monitors_collection.stream()
            return {doc.id: doc.to_dict() for doc in docs}

    def delete_monitor(self, monitor_id: str) -> bool:
        """Delete a monitor and its alerts"""
        with self.lock:
            monitor_ref = self.monitors_collection.document(monitor_id)
            doc = monitor_ref.get()

            if doc.exists:
                # Delete all alerts in the subcollection first
                alerts_ref = monitor_ref.collection("alerts")
                for alert_doc in alerts_ref.stream():
                    alert_doc.reference.delete()

                # Delete the monitor document
                monitor_ref.delete()
                return True
            return False

    # Alert operations
    def save_alert(self, monitor_id: str, alert_data: Dict):
        """Save an alert for a monitor as a subcollection"""
        with self.lock:
            # Add timestamp if not present
            if "timestamp" not in alert_data:
                alert_data["timestamp"] = datetime.now().isoformat()

            # Add the alert as a new document in the monitor's alerts subcollection
            alerts_ref = self.monitors_collection.document(monitor_id).collection(
                "alerts"
            )
            alerts_ref.add(alert_data)

    def get_alerts(self, monitor_id: str) -> List[Dict]:
        """Get all alerts for a monitor from its subcollection"""
        with self.lock:
            alerts_ref = self.monitors_collection.document(monitor_id).collection(
                "alerts"
            )
            query = alerts_ref.order_by("timestamp")
            docs = query.stream()

            alerts = []
            for doc in docs:
                alerts.append(doc.to_dict())

            return alerts

    def delete_alerts(self, monitor_id: str) -> bool:
        """Delete all alerts for a monitor from its subcollection"""
        with self.lock:
            alerts_ref = self.monitors_collection.document(monitor_id).collection(
                "alerts"
            )
            docs = alerts_ref.stream()

            deleted = False
            for doc in docs:
                doc.reference.delete()
                deleted = True

            return deleted

    def clear_all(self):
        """Clear all data (for testing)"""
        with self.lock:
            # Delete all monitors and their subcollections
            for doc in self.monitors_collection.stream():
                # Delete alerts subcollection
                alerts_ref = doc.reference.collection("alerts")
                for alert_doc in alerts_ref.stream():
                    alert_doc.reference.delete()

                # Delete monitor document
                doc.reference.delete()


# Global storage instance
file_storage = FirestoreStorage()
