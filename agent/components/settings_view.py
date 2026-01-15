import flet as ft
from agent.constants import *

class SettingsView(ft.Column):
    def __init__(self, page: ft.Page, settings_callback=None):
        super().__init__()
        self.page = page
        self.settings_callback = settings_callback
        self.expand = True
        self.scroll = ft.ScrollMode.ADAPTIVE
        self.spacing = 20
        
        self.agent_id_text = ft.Text("Not Connected", size=14, color=DARK_TEXT, selectable=True, font_family=FONT_MONO)
        
        self.controls = [
            ft.Text("SETTINGS", size=18, weight=ft.FontWeight.BOLD, color=DARK_TEXT),
            
            self._build_section("GENERAL", [
                self._build_switch("Launch on System Startup", False, "startup"),
                self._build_switch("Minimize to Tray on Close", True, "minimize"),
                self._build_switch("Show Browser Window", False, "headless"),
            ]),
            
            self._build_section("AGENT INFO", [
                ft.Container(
                    content=ft.Column([
                        ft.Text("AGENT ID", size=10, color=DARK_MUTED, weight=ft.FontWeight.W_600),
                        self.agent_id_text
                    ], spacing=8),
                    padding=15,
                    bgcolor=DARK_CARD,
                    border=ft.border.all(1, DARK_BORDER),
                    border_radius=8
                )
            ])
        ]

    def _build_section(self, title, controls):
        return ft.Column([
            ft.Text(title, size=11, weight=ft.FontWeight.W_600, color=BRAND_GREEN),
            ft.Container(height=10),
            ft.Column(controls, spacing=10)
        ], spacing=0)

    def _build_switch(self, label, value, key):
        return ft.Container(
            content=ft.Row([
                ft.Text(label, size=13, color=DARK_TEXT, expand=True),
                ft.Switch(
                    value=value,
                    active_color=BRAND_GREEN,
                    on_change=lambda e: self.settings_callback(key, e.control.value) if self.settings_callback else None
                )
            ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
            padding=ft.padding.symmetric(horizontal=15, vertical=10),
            bgcolor=DARK_CARD,
            border=ft.border.all(1, DARK_BORDER),
            border_radius=8
        )

    def update_agent_id(self, agent_id):
        self.agent_id_text.value = agent_id
        if self.page:
            self.page.update()
