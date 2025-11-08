"""
Scheduler for managing polling intervals and timing
"""

import time
from typing import Optional


class AdaptiveScheduler:
    """Manages polling intervals based on match activity"""

    def __init__(
        self,
        default_interval: int = 60,
        min_interval: int = 10,
        max_interval: int = 300,
    ):
        """
        Initialize scheduler

        Args:
            default_interval: Default polling interval in seconds
            min_interval: Minimum polling interval in seconds
            max_interval: Maximum polling interval in seconds
        """
        self.default_interval = default_interval
        self.min_interval = min_interval
        self.max_interval = max_interval
        self.last_poll_time: Optional[float] = None
        self.next_check_interval = default_interval

    def set_next_interval(self, estimated_minutes: Optional[float] = None):
        """
        Set the next polling interval

        Args:
            estimated_minutes: Estimated minutes until next check (from watcher)
        """
        if estimated_minutes is not None:
            interval = int(estimated_minutes * 60)
            self.next_check_interval = max(
                self.min_interval, min(interval, self.max_interval)
            )
        else:
            self.next_check_interval = self.default_interval

    def should_poll(self) -> bool:
        """
        Check if it's time to poll again

        Returns:
            True if should poll now, False otherwise
        """
        if self.last_poll_time is None:
            return True

        elapsed = time.time() - self.last_poll_time
        return elapsed >= self.next_check_interval

    def mark_polled(self):
        """Mark that a poll has occurred"""
        self.last_poll_time = time.time()

    def wait_until_next_poll(self):
        """Sleep until next poll time"""
        if self.last_poll_time is None:
            return

        elapsed = time.time() - self.last_poll_time
        remaining = self.next_check_interval - elapsed

        if remaining > 0:
            print(f"⏳ Next check in {remaining:.0f} seconds...")
            time.sleep(remaining)

    def get_time_until_next(self) -> float:
        """
        Get time remaining until next poll

        Returns:
            Seconds until next poll
        """
        if self.last_poll_time is None:
            return 0

        elapsed = time.time() - self.last_poll_time
        remaining = self.next_check_interval - elapsed
        return max(0, remaining)
