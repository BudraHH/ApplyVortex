import flet as ft
from agent.constants import *

class PortalCard(ft.Container):
    def __init__(self, name, url, last_sync, success_rate, is_connected, login_callback=None):
        super().__init__()
        self.name = name
        self.key = name.lower()
        self.login_callback = login_callback
        self.is_connected = is_connected
        
        self.bgcolor = DARK_CARD
        self.border = ft.border.all(1, DARK_BORDER)
        self.border_radius = 8
        self.padding = 20
        self.margin = ft.margin.only(bottom=15)
        
        # Portal info header
        header = ft.Row([
            ft.Column([
                ft.Text(name.upper(), size=14, weight=ft.FontWeight.BOLD, color=DARK_TEXT),
                ft.Row([
                    ft.Icon(ft.icons.LINK, size=12, color=DARK_MUTED),
                    ft.Text(url, size=11, color=DARK_MUTED)
                ], spacing=6)
            ], spacing=4, expand=True),
            ft.Column([
                ft.Text("LAST SYNC", size=9, color=DARK_MUTED, weight=ft.FontWeight.W_600),
                ft.Text(last_sync, size=12, color=DARK_TEXT, weight=ft.FontWeight.W_500)
            ], spacing=2, horizontal_alignment=ft.CrossAxisAlignment.END),
            ft.Container(width=20),
            ft.Column([
                ft.Text("SUCCESS", size=9, color=DARK_MUTED, weight=ft.FontWeight.W_600),
                ft.Text(success_rate, size=12, color=BRAND_GREEN if success_rate != "-" else DARK_MUTED, weight=ft.FontWeight.BOLD)
            ], spacing=2, horizontal_alignment=ft.CrossAxisAlignment.END)
        ], vertical_alignment=ft.CrossAxisAlignment.START)
        
        # Action button
        if is_connected:
            action_button = ft.Container(
                content=ft.Text("TERMINATE SESSION", size=11, color=BRAND_RED, weight=ft.FontWeight.W_600, text_align=ft.TextAlign.CENTER),
                bgcolor=ft.colors.with_opacity(0.15, BRAND_RED),
                border_radius=6,
                padding=ft.padding.symmetric(vertical=12),
                expand=True,
                on_click=lambda _: self._handle_terminate(),
                alignment=ft.alignment.center
            )
        else:
            action_button = ft.Container(
                content=ft.Text("ESTABLISH CONNECTION", size=11, color=BRAND_GREEN, weight=ft.FontWeight.W_600, text_align=ft.TextAlign.CENTER),
                bgcolor=ft.colors.with_opacity(0.15, BRAND_GREEN),
                border_radius=6,
                padding=ft.padding.symmetric(vertical=12),
                expand=True,
                on_click=lambda _: self._handle_connect(),
                alignment=ft.alignment.center
            )
        
        # Settings icon
        settings_icon = ft.Container(
            content=ft.Icon(ft.icons.SETTINGS_OUTLINED, size=18, color=DARK_MUTED),
            width=44,
            height=44,
            bgcolor=DARK_SURFACE,
            border=ft.border.all(1, DARK_BORDER),
            border_radius=6,
            alignment=ft.alignment.center
        )
        
        self.content = ft.Column([
            header,
            ft.Container(height=15),
            ft.Row([action_button, settings_icon], spacing=10)
        ], spacing=0)
    
    def _handle_connect(self):
        if self.login_callback:
            self.login_callback(self.key)
    
    def _handle_terminate(self):
        # Could add terminate logic here
        pass
    
    def update_status(self, last_sync, success_rate, is_connected):
        self.is_connected = is_connected
        # Rebuild content with new status
        self.__init__(self.name, 
                      f"HTTPS://{self.name.upper()}.COM", 
                      last_sync, 
                      success_rate, 
                      is_connected, 
                      self.login_callback)
        self.update()

class PortalsView(ft.Column):
    def __init__(self, page: ft.Page, login_callback=None):
        super().__init__()
        self.page = page
        self.login_callback = login_callback
        self.expand = True
        self.scroll = ft.ScrollMode.AUTO
        self.spacing = 0
        
        self.portal_cards = {}
        
        # Header
        header = ft.Container(
            content=ft.Column([
                ft.Text("MANAGED PORTALS", size=18, weight=ft.FontWeight.BOLD, color=DARK_TEXT),
                ft.Text("CONNECT AND MANAGE AGENT SESSIONS ACROSS JOB PLATFORMS.", size=11, color=DARK_MUTED)
            ], spacing=8),
            margin=ft.margin.only(bottom=25)
        )
        
        # Portal cards
        linkedin_card = PortalCard("LinkedIn", "HTTPS://LINKEDIN.COM", "2M AGO", "94%", True, login_callback)
        naukri_card = PortalCard("Naukri", "HTTPS://NAUKRI.COM", "15M AGO", "88%", True, login_callback)
        indeed_card = PortalCard("Indeed", "HTTPS://INDEED.COM", "2D AGO", "-", False, login_callback)
        
        self.portal_cards["linkedin"] = linkedin_card
        self.portal_cards["naukri"] = naukri_card
        self.portal_cards["indeed"] = indeed_card
        
        self.controls = [
            header,
            linkedin_card,
            naukri_card,
            indeed_card
        ]
    
    def update_status(self, key, status, is_active=True):
        if key in self.portal_cards:
            last_sync = "JUST NOW" if is_active else "N/A"
            success_rate = "94%" if is_active else "-"
            self.portal_cards[key].update_status(last_sync, success_rate, is_active)
