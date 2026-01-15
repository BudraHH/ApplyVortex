import flet as ft
from agent.constants import *
from datetime import datetime

class Terminal(ft.Container):
    def __init__(self, page: ft.Page):
        super().__init__()
        self.page = page
        self.height = 150
        self.bgcolor = DARK_CARD
        self.border = ft.border.all(1, DARK_BORDER)
        self.border_radius = 8
        self.padding = 0
        
        self.list_view = ft.ListView(
            expand=True,
            spacing=2,
            padding=10,
            auto_scroll=True
        )
        
        # Header with AGENT LIVE LOGS and ACTIVE badge
        header = ft.Container(
            content=ft.Row([
                ft.Row([
                    ft.Text(">_", size=12, color=DARK_MUTED, font_family=FONT_MONO),
                    ft.Text("AGENT LIVE LOGS", size=11, color=DARK_MUTED, weight=ft.FontWeight.W_600)
                ], spacing=10),
                ft.Container(
                    content=ft.Row([
                        ft.Container(width=6, height=6, bgcolor=BRAND_GREEN, border_radius=3),
                        ft.Text("ACTIVE", size=9, weight=ft.FontWeight.BOLD, color=BRAND_GREEN)
                    ], spacing=4),
                    padding=ft.padding.symmetric(horizontal=10, vertical=4),
                    bgcolor=ft.colors.with_opacity(0.15, BRAND_GREEN),
                    border_radius=4
                ),
                ft.Icon(ft.icons.KEYBOARD_ARROW_UP, size=18, color=DARK_MUTED)
            ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
            padding=ft.padding.symmetric(horizontal=15, vertical=10),
            border=ft.border.only(bottom=ft.BorderSide(1, DARK_BORDER))
        )
        
        self.content = ft.Column([
            header,
            self.list_view
        ], spacing=0, expand=True)

    async def add_log(self, message: str, level: str = "INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        if level == "SUCCESS":
            text_color = BRAND_GREEN
        elif level == "ERROR":
            text_color = BRAND_RED
        elif level == "WARNING":
            text_color = BRAND_YELLOW
        else:
            text_color = BRAND_CYAN

        log_item = ft.Row([
            ft.Container(
                content=ft.Text(timestamp, size=11, color=DARK_MUTED, font_family=FONT_MONO),
                width=70
            ),
            ft.Container(
                content=ft.Text(message, size=12, color=text_color, font_family=FONT_MONO, weight=ft.FontWeight.W_400),
                expand=True
            )
        ], vertical_alignment=ft.CrossAxisAlignment.START, spacing=10)
        
        self.list_view.controls.append(log_item)
        if len(self.list_view.controls) > 500:
            self.list_view.controls.pop(0)
        
        await self.update_async()

    def clear(self):
        self.list_view.controls.clear()
        self.update()
