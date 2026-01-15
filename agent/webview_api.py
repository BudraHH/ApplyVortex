"""
PyWebView API Bridge
Exposes Python agent functions to the React UI via JavaScript.
This class is passed to pywebview and becomes accessible as window.pywebview.api in JS.
"""
import asyncio
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from collections import deque

from agent.settings_manager import settings_manager

logger = logging.getLogger("AgentForge.WebViewAPI")


class AgentWebViewAPI:
    """
    API bridge between React UI and Python Agent backend.
    All methods here are callable from JavaScript as:
        window.pywebview.api.methodName(args)
    """
    
    def __init__(self, client=None):
        self.client = client
        self.is_online = False
        self.is_active = True
        
        # Use the global settings manager
        self.settings_manager = settings_manager
        
        # Stats
        self.jobs_found = 0
        self.apps_sent = 0
        self.tasks_done = 0
        self.success_rate = 0
        
        # Activity log (keep last 100 entries)
        self.activity_log: deque = deque(maxlen=100)
        
        # Terminal logs (keep last 200 entries)
        self.terminal_logs: deque = deque(maxlen=200)
        
        # Callbacks for browser login
        self._login_callback = None
        
        # Start time for uptime calculation
        self.start_time = datetime.now()
        
        # Portal statuses
        self.portal_status = {
            "linkedin": {"connected": False, "last_sync": None, "success_rate": "-"},
            "naukri": {"connected": False, "last_sync": None, "success_rate": "-"},
            "indeed": {"connected": False, "last_sync": None, "success_rate": "-"},
            "glassdoor": {"connected": False, "last_sync": None, "success_rate": "-"},
        }
        
        # Task queue
        self.task_queue: List[Dict] = []
        
        # Settings are now managed by settings_manager
        # (kept for API compatibility, delegates to settings_manager)


    # ============ STATS ============
    
    def get_stats(self) -> Dict[str, Any]:
        """Return current agent statistics."""
        uptime_delta = datetime.now() - self.start_time
        hours, remainder = divmod(int(uptime_delta.total_seconds()), 3600)
        minutes, _ = divmod(remainder, 60)
        uptime_str = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
        
        return {
            "jobs_found": self.jobs_found,
            "applied": self.apps_sent,
            "tasks": self.tasks_done,
            "success_rate": f"{self.success_rate}%",
            "uptime": uptime_str,
            "is_online": self.is_online
        }
    
    def update_stats(self, jobs=None, apps=None, tasks=None, success=None):
        """Update stats from Python side."""
        if jobs is not None:
            self.jobs_found = jobs
        if apps is not None:
            self.apps_sent = apps
        if tasks is not None:
            self.tasks_done = tasks
        if success is not None:
            self.success_rate = success

    # ============ ACTIVITIES ============
    
    def get_activities(self) -> List[Dict]:
        """Return recent activity entries for Activity Feed."""
        return list(self.activity_log)
    
    def add_activity(self, message: str, activity_type: str = "info", task_type: str = "UNKNOWN"):
        """Add a new activity entry."""
        entry = {
            "id": len(self.activity_log) + 1,
            "message": message,
            "type": activity_type,  # success, warning, error, info
            "taskType": task_type,
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "time": "Just now"
        }
        self.activity_log.appendleft(entry)
        return entry

    # ============ TERMINAL LOGS ============
    
    def get_terminal_logs(self) -> List[Dict]:
        """Return terminal log entries."""
        return list(self.terminal_logs)
    
    def add_log(self, message: str, level: str = "INFO"):
        """Add a terminal log entry."""
        entry = {
            "id": len(self.terminal_logs) + 1,
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "level": level.lower(),  # info, success, warning, error
            "message": message
        }
        self.terminal_logs.appendleft(entry)
        
        # Also add to activity if it's important
        if level.upper() in ["SUCCESS", "ERROR", "WARNING"]:
            self.add_activity(message, level.lower())
        
        return entry

    # ============ PORTALS ============
    
    def get_portals(self) -> List[Dict]:
        """Return portal connection statuses."""
        portals = []
        portal_info = {
            "linkedin": {"name": "LinkedIn", "url": "https://linkedin.com", "color": "bg-brand"},
            "naukri": {"name": "Naukri", "url": "https://naukri.com", "color": "bg-orange-500"},
            "indeed": {"name": "Indeed", "url": "https://indeed.com", "color": "bg-brand"},
            "glassdoor": {"name": "Glassdoor", "url": "https://glassdoor.com", "color": "bg-emerald-600"},
        }
        
        for key, status in self.portal_status.items():
            info = portal_info.get(key, {})
            portals.append({
                "id": key,
                "name": info.get("name", key.capitalize()),
                "url": info.get("url", ""),
                "status": "connected" if status["connected"] else "disconnected",
                "lastSync": status["last_sync"] or "Never",
                "successRate": status["success_rate"],
                "color": info.get("color", "bg-brand")
            })
        
        return portals
    
    def connect_portal(self, portal_id: str):
        """Initiate portal connection (opens browser for login)."""
        logger.info(f"Portal connection requested: {portal_id}")
        self.add_log(f"Connecting to {portal_id.capitalize()}...", "INFO")
        
        # This will be called by the React UI
        # The actual login logic will be handled by the agent
        if self._login_callback:
            asyncio.run_coroutine_threadsafe(
                self._login_callback(portal_id),
                asyncio.get_event_loop()
            )
        
        return {"status": "connecting", "portal": portal_id}
    
    def disconnect_portal(self, portal_id: str):
        """Disconnect a portal session."""
        self.portal_status[portal_id]["connected"] = False
        self.portal_status[portal_id]["last_sync"] = None
        self.add_log(f"Disconnected from {portal_id.capitalize()}", "WARNING")
        return {"status": "disconnected", "portal": portal_id}
    
    def update_portal_status(self, portal_id: str, connected: bool, success_rate: str = None):
        """Update portal status from Python side."""
        self.portal_status[portal_id]["connected"] = connected
        self.portal_status[portal_id]["last_sync"] = datetime.now().strftime("%H:%M")
        if success_rate:
            self.portal_status[portal_id]["success_rate"] = success_rate

    # ============ TASK QUEUE ============
    
    def get_tasks(self) -> List[Dict]:
        """Return current task queue."""
        return self.task_queue
    
    def add_task(self, task_type: str, description: str, priority: int = 2):
        """Add a task to the queue."""
        task = {
            "id": f"T{len(self.task_queue) + 1}",
            "taskType": task_type,
            "priority": priority,
            "status": "pending",
            "description": description,
            "timeAdded": "Just now"
        }
        self.task_queue.append(task)
        return task
    
    def update_task_status(self, task_id: str, status: str):
        """Update task status."""
        for task in self.task_queue:
            if task["id"] == task_id:
                task["status"] = status
                return task
        return None
    
    def remove_task(self, task_id: str):
        """Remove a completed task."""
        self.task_queue = [t for t in self.task_queue if t["id"] != task_id]

    # ============ SETTINGS ============
    
    def get_settings(self) -> Dict[str, Any]:
        """Return current settings."""
        return self.settings_manager.get_all()
    
    def update_setting(self, key: str, value: Any):
        """Update a setting - this actually applies the change."""
        result = self.settings_manager.set(key, value)
        
        if result.get("success"):
            applied = result.get("applied", False)
            if applied:
                self.add_log(f"✓ Setting applied: {key} = {value}", "SUCCESS")
            else:
                self.add_log(f"⚠ Setting saved but may require restart: {key}", "WARNING")
        else:
            self.add_log(f"✗ Failed to update {key}: {result.get('error')}", "ERROR")
        
        return result
    
    def get_agent_info(self) -> Dict[str, str]:
        """Return agent information."""
        return {
            "agent_id": self.client.agent_id if self.client else "Not Connected",
            "server_url": self.client.base_url if self.client else "N/A",
            "version": "2.0.1"
        }

    # ============ WINDOW CONTROLS ============
    
    def minimize_window(self):
        """Minimize the window."""
        # This will be handled by pywebview
        pass
    
    def maximize_window(self):
        """Maximize the window."""
        pass
    
    def close_window(self):
        """Close the window (minimize to tray if enabled)."""
        self.is_active = False

    # ============ SYSTEM ============
    
    def get_system_status(self) -> Dict[str, Any]:
        """Return system status for status bar."""
        import psutil
        
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.Process().memory_info()
            memory_mb = memory.rss / (1024 * 1024)
        except:
            cpu_percent = 0
            memory_mb = 0
        
        return {
            "status": "ready" if self.is_online else "offline",
            "cpu": f"{cpu_percent:.0f}%",
            "memory": f"{memory_mb:.0f} MB",
            "version": "REL_2.0.1"
        }

    # ============ POLLING (for React to get updates) ============
    
    def poll_updates(self) -> Dict[str, Any]:
        """
        Called by React periodically to get all updates at once.
        This is more efficient than multiple API calls.
        """
        return {
            "stats": self.get_stats(),
            "activities": list(self.activity_log)[:10],  # Last 10
            "terminal_logs": list(self.terminal_logs)[-20:],  # Last 20
            "portals": self.get_portals(),
            "tasks": self.task_queue,
            "system": self.get_system_status()
        }
