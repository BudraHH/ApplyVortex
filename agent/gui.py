import asyncio
import flet as ft
import logging
from datetime import datetime
import webbrowser
from config import settings
from agent.utils.startup import enable_startup, disable_startup, is_startup_enabled
from agent.core.browser_service import browser_service
from agent.constants import *
from agent.components.sidebar import Sidebar
from agent.components.dashboard_view import DashboardView
from agent.components.portals_view import PortalsView
from agent.components.settings_view import SettingsView
from agent.components.status_bar import StatusBar

logger = logging.getLogger("AgentForge.GUI")

class AgentGUI:
    def __init__(self, agent_id, server_url):
        self.agent_id = agent_id
        self.server_url = server_url
        self.page: ft.Page = None
        
        # State
        self.is_online = False
        self.is_active = True
        self.is_working = False
        self.minimize_to_tray = True
        self.tasks_completed = 0
        self.jobs_found_count = 0 
        self.apps_sent_count = 0
        self.uptime_start = datetime.now()
        
        # Component References
        self.sidebar = None
        self.dashboard_view = None
        self.portals_view = None
        self.settings_view = None
        self.status_bar = None
        self.content_container = None

    async def main(self, page: ft.Page):
        self.page = page
        page.title = "ApplyVortex Agent"
        page.window.width = 900
        page.window.height = 600
        page.window.min_width = 800
        page.window.min_height = 500
        page.window.resizable = True
        page.theme_mode = ft.ThemeMode.DARK
        page.bgcolor = DARK_BG
        page.padding = 0
        page.spacing = 0
        
        page.fonts = {
            "JetBrains Mono": "https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/ttf/JetBrainsMono-Regular.ttf",
            "Inter": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        }
        page.theme = ft.Theme(font_family=FONT_UI)

        page.window.prevent_close = True
        page.window.on_event = self._on_window_event
        
        # Custom window controls
        page.window.title_bar_hidden = False

        # Initialize Components
        self.sidebar = Sidebar(page, self._handle_nav_change)
        self.dashboard_view = DashboardView(page)
        self.portals_view = PortalsView(page, self._handle_login_click)
        self.settings_view = SettingsView(page, self._handle_settings_change)
        self.status_bar = StatusBar(page)
        
        self.content_container = ft.Container(
            content=self.dashboard_view,
            expand=True,
            padding=25,
            bgcolor=DARK_BG
        )

        # Build Layout - Main area with sidebar and content
        main_area = ft.Row([
            self.sidebar,
            ft.Column([
                self.content_container,
                self.status_bar
            ], expand=True, spacing=0)
        ], expand=True, spacing=0)
        
        # Outer container with rounded corners and shadow
        outer_container = ft.Container(
            content=main_area,
            expand=True,
            bgcolor=DARK_BG,
            border_radius=12,
            border=ft.border.all(1, DARK_BORDER),
            clip_behavior=ft.ClipBehavior.ANTI_ALIAS
        )

        page.add(outer_container)
        
        # Initial updates
        self.settings_view.update_agent_id(self.agent_id)
        
        asyncio.create_task(self._animation_loop())
        await self.add_log("Agent initialized and ready.", "SUCCESS")

    def _handle_nav_change(self, view_name):
        if view_name == "dashboard":
            self.content_container.content = self.dashboard_view
        elif view_name == "portals":
            self.content_container.content = self.portals_view
        elif view_name == "settings":
            self.content_container.content = self.settings_view
        elif view_name == "tasks":
            # Tasks view placeholder
            self.content_container.content = ft.Container(
                content=ft.Text("TASKS VIEW - Coming Soon", size=18, color=DARK_MUTED),
                expand=True,
                alignment=ft.alignment.center
            )
        elif view_name == "activity":
            # Activity log view placeholder
            self.content_container.content = ft.Container(
                content=ft.Text("ACTIVITY LOG - Coming Soon", size=18, color=DARK_MUTED),
                expand=True,
                alignment=ft.alignment.center
            )
        self.page.update()

    def _handle_settings_change(self, key, value):
        if key == "startup":
            if value:
                enable_startup()
            else:
                disable_startup()
        elif key == "minimize":
            self.minimize_to_tray = value
        elif key == "headless":
            settings.HEADLESS = not value
            logger.info(f"Headless mode set to: {settings.HEADLESS}")

    def _handle_login_click(self, portal_key):
        url_map = {
            "linkedin": "https://www.linkedin.com/login",
            "naukri": "https://www.naukri.com/nlogin/login",
            "indeed": "https://secure.indeed.com/account/login"
        }
        regex_map = {
            "linkedin": r"linkedin\.com/feed",
            "naukri": r"naukri\.com/mnj",
            "indeed": r"indeed\.com"
        }
        if portal_key in url_map:
            self.page.run_task(self._process_login, portal_key.capitalize(), url_map[portal_key], regex_map.get(portal_key))

    async def _process_login(self, name, url, success_regex=None):
        await self.add_log(f"🔑 Launching authentication for {name}...", "WARNING")
        
        was_active = self.is_active
        self.is_active = False 
        
        success = await browser_service.launch_interactive_session(url, success_url_regex=success_regex)
        
        self.is_active = was_active
        
        if success:
            await self.add_log(f"✓ {name} session authenticated successfully", "SUCCESS")
            self.portals_view.update_status(name.lower(), "Active", True)
        else:
            await self.add_log(f"✗ {name} authentication failed", "ERROR")

    def _on_window_event(self, e):
        if e.data == "close":
            if self.minimize_to_tray:
                e.page.window.visible = False
                e.page.update()
                self.page.run_task(self.add_log, "Minimized to system tray", "INFO")
            else:
                e.page.window.destroy()

    # --- Public API ---

    async def update_status(self, online: bool):
        self.is_online = online
        # Could update sidebar LIVE indicator here

    async def add_log(self, message, type="info"):
        if not self.dashboard_view: return
        
        level_map = {
            "info": "INFO",
            "success": "SUCCESS",
            "error": "ERROR",
            "warning": "WARNING",
            "task": "INFO"
        }
        await self.dashboard_view.terminal.add_log(message, level_map.get(type.lower(), "INFO"))
        
        # Also add to activity feed
        activity_type_map = {
            "success": "success",
            "error": "warning",
            "warning": "warning",
            "info": "info",
            "task": "scraping"
        }
        self.dashboard_view.add_activity(message, activity_type_map.get(type.lower(), "info"))
        
        # Update working state for animations
        if "executing" in message.lower() or "scraping" in message.lower():
            self.is_working = True
        elif "completed" in message.lower() or "failed" in message.lower():
            self.is_working = False

    async def update_stats(self, completed=None, success_rate=None):
        if not self.dashboard_view: return
        if completed is not None:
            self.tasks_completed = completed
            self.dashboard_view.stats_grid.tasks_card.update_value(completed)

    async def update_job_count(self, count):
        self.jobs_found_count += count
        if self.dashboard_view:
            self.dashboard_view.stats_grid.jobs_card.update_value(self.jobs_found_count)

    async def update_apps_count(self, count):
        self.apps_sent_count += count
        if self.dashboard_view:
            self.dashboard_view.stats_grid.apps_card.update_value(self.apps_sent_count)

    async def _animation_loop(self):
        while True:
            if not self.page: 
                await asyncio.sleep(1)
                continue

            await asyncio.sleep(1)