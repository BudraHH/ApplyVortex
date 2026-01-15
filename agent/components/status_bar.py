import flet as ft
from agent.constants import *

class StatusBar(ft.Container):
    def __init__(self, page: ft.Page):
        super().__init__()
        self.page = page
        self.height = 35
        self.bgcolor = DARK_SURFACE
        self.border = ft.border.only(top=ft.BorderSide(1, DARK_BORDER))
        self.padding = ft.padding.symmetric(horizontal=20, vertical=0)
        
        self.content = ft.Row([
            # System status
            ft.Row([
                ft.Text("SYSTEM READY", size=10, color=BRAND_GREEN, weight=ft.FontWeight.W_600),
                ft.Container(width=20),
                ft.Text("CPU 12%", size=10, color=DARK_MUTED, weight=ft.FontWeight.W_500),
                ft.Container(width=10),
                ft.Text("MEM 245MB", size=10, color=DARK_MUTED, weight=ft.FontWeight.W_500)
            ], spacing=0),
            # Version
            ft.Text("R-1.2.0", size=10, color=DARK_MUTED, weight=ft.FontWeight.W_500)
        ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN, vertical_alignment=ft.CrossAxisAlignment.CENTER)
    
    def update_stats(self, cpu_percent, mem_mb):
        self.content.controls[0].controls[2].value = f"CPU {cpu_percent}%"
        self.content.controls[0].controls[4].value = f"MEM {mem_mb}MB"
        self.update()
