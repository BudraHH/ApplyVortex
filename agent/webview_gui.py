"""
PyWebView-based GUI for ApplyVortex Agent.
This provides the bridge between the React UI and Python backend.
"""
import os
import sys
import asyncio
import logging
import threading
from typing import Optional

import webview

from agent.webview_api import AgentWebViewAPI

logger = logging.getLogger("AgentForge.WebViewGUI")


class AgentWebViewGUI:
    """
    PyWebView-based GUI wrapper.
    Loads the React app and exposes Python functions via JS bridge.
    """
    
    def __init__(self, client=None):
        self.client = client
        self.api = AgentWebViewAPI(client)
        self.window: Optional[webview.Window] = None
        self._event_loop: Optional[asyncio.AbstractEventLoop] = None
        
        # Get UI path
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.ui_path = os.path.join(current_dir, "ui", "index.html")
        
        if not os.path.exists(self.ui_path):
            logger.error(f"UI not found at: {self.ui_path}")
            raise FileNotFoundError(f"React UI not found. Expected at: {self.ui_path}")

    @property
    def is_active(self) -> bool:
        """Check if GUI is active."""
        return self.api.is_active
    
    async def update_status(self, online: bool):
        """Update online status."""
        self.api.is_online = online
        
    async def add_log(self, message: str, type: str = "info"):
        """Add a log entry to both terminal and activity feed."""
        level_map = {
            "success": "SUCCESS",
            "error": "ERROR",
            "warning": "WARNING",
            "info": "INFO",
            "task": "INFO"
        }
        self.api.add_log(message, level_map.get(type.lower(), "INFO"))
    
    async def update_stats(self, jobs=None, apps=None, tasks=None, success=None):
        """Update statistics."""
        self.api.update_stats(jobs=jobs, apps=apps, tasks=tasks, success=success)
    
    def update_portal_status(self, portal_id: str, connected: bool, success_rate: str = None):
        """Update portal connection status."""
        self.api.update_portal_status(portal_id, connected, success_rate)
    
    def set_login_callback(self, callback):
        """Set the callback for portal login requests."""
        self.api._login_callback = callback

    def start(self, on_started=None):
        """
        Start the PyWebView window.
        This is a blocking call - it runs the webview event loop.
        
        Args:
            on_started: Optional callback to run after window is created.
        """
        logger.info(f"Starting PyWebView GUI with UI from: {self.ui_path}")
        
        # Create the window
        self.window = webview.create_window(
            title="ApplyVortex Agent",
            url=self.ui_path,
            width=1024,
            height=720,
            min_size=(800, 500),
            resizable=True,
            frameless=False,  # Use native title bar
            easy_drag=False,
            js_api=self.api,  # Expose Python API to JavaScript
            background_color="#050505"  # Match app's dark background
        )
        
        # Set up event handlers
        self.window.events.loaded += self._on_loaded
        self.window.events.closed += self._on_closed
        
        # Start webview (blocking)
        if on_started:
            webview.start(on_started, debug=False)
        else:
            webview.start(debug=False)
    
    def _on_loaded(self):
        """Called when the React app is fully loaded."""
        logger.info("React UI loaded successfully")
        self.api.add_log("Agent GUI initialized", "SUCCESS")
    
    def _on_closed(self):
        """Called when the window is closed."""
        logger.info("GUI window closed")
        self.api.is_active = False


def run_gui_with_agent(client, agent_loop_coro):
    """
    Run the PyWebView GUI alongside the agent loop.
    
    This function:
    1. Creates the API bridge
    2. Starts the agent loop in a background thread
    3. Runs the PyWebView window (blocking)
    
    Args:
        client: The APIClient instance
        agent_loop_coro: Coroutine function for the agent loop (async def agent_loop)
    """
    gui = AgentWebViewGUI(client)
    
    # Set up login callback
    from agent.core.browser_service import browser_service
    
    async def handle_login(portal_id: str):
        """Handle portal login requests from UI."""
        url_map = {
            "linkedin": "https://www.linkedin.com/login",
            "naukri": "https://www.naukri.com/nlogin/login",
            "indeed": "https://secure.indeed.com/account/login",
            "glassdoor": "https://www.glassdoor.com/profile/login_input.htm"
        }
        regex_map = {
            "linkedin": r"linkedin\.com/feed",
            "naukri": r"naukri\.com/mnj",
            "indeed": r"indeed\.com",
            "glassdoor": r"glassdoor\.com/member"
        }
        
        url = url_map.get(portal_id)
        regex = regex_map.get(portal_id)
        
        if url:
            await gui.add_log(f"🔑 Launching {portal_id.capitalize()} authentication...", "warning")
            try:
                from config import settings
                settings.HEADLESS = False  # Show browser for login
                success = await browser_service.login_to_portal(portal_id.capitalize(), url, regex)
                if success:
                    await gui.add_log(f"✓ {portal_id.capitalize()} authenticated successfully", "success")
                    gui.update_portal_status(portal_id, True, "94%")
                else:
                    await gui.add_log(f"✗ {portal_id.capitalize()} authentication failed", "error")
            except Exception as e:
                await gui.add_log(f"Login error: {e}", "error")
    
    gui.set_login_callback(handle_login)
    
    def run_agent_in_background():
        """Run the agent loop in a separate thread with its own event loop."""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        async def agent_wrapper():
            # Wait a bit for GUI to initialize
            await asyncio.sleep(1)
            await gui.add_log("Agent loop starting...", "info")
            await agent_loop_coro(client, gui)
        
        try:
            loop.run_until_complete(agent_wrapper())
        except Exception as e:
            logger.error(f"Agent loop error: {e}")
        finally:
            loop.close()
    
    def on_gui_started():
        """Called when PyWebView window is created."""
        # Start agent loop in background thread
        agent_thread = threading.Thread(target=run_agent_in_background, daemon=True)
        agent_thread.start()
    
    # Start the GUI (blocking)
    gui.start(on_started=on_gui_started)
