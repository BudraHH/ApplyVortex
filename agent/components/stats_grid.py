import flet as ft
from agent.constants import *

class StatCard(ft.Container):
    def __init__(self, value, label, value_color="#FFFFFF"):
        super().__init__()
        self.value_color = value_color
        self.value_text = ft.Text(str(value), size=32, weight=ft.FontWeight.BOLD, color=value_color)
        self.label_text = ft.Text(label.upper(), size=10, color=DARK_MUTED, weight=ft.FontWeight.W_500)
        
        self.padding = ft.padding.symmetric(horizontal=20, vertical=15)
        self.border = ft.border.only(right=ft.BorderSide(1, DARK_BORDER))
        
        self.content = ft.Column([
            self.value_text,
            self.label_text
        ], spacing=4, horizontal_alignment=ft.CrossAxisAlignment.START)

    def update_value(self, new_value):
        self.value_text.value = str(new_value)
        self.update()

class StatsGrid(ft.Container):
    def __init__(self, page: ft.Page):
        super().__init__()
        self.page = page
        
        # Create stat cards matching the design
        self.jobs_card = StatCard("142", "Jobs Found", BRAND_CYAN)
        self.apps_card = StatCard("47", "Applied", DARK_TEXT)
        self.tasks_card = StatCard("12", "Tasks", BRAND_GREEN)
        self.success_card = StatCard("89%", "Success", BRAND_YELLOW)
        
        # Add subtitles
        self.jobs_card.content.controls.append(
            ft.Text("FOUND ON LINKEDIN", size=8, color=DARK_MUTED)
        )
        self.apps_card.content.controls.append(
            ft.Text("AUTO APPLIED", size=8, color=DARK_MUTED)
        )
        self.tasks_card.content.controls.append(
            ft.Text("IN QUEUE", size=8, color=DARK_MUTED)
        )
        self.success_card.content.controls.append(
            ft.Text("MATCH RATE", size=8, color=DARK_MUTED)
        )
        
        # Remove right border from last card
        self.success_card.border = None
        
        self.bgcolor = DARK_CARD
        self.border = ft.border.all(1, DARK_BORDER)
        self.border_radius = 8
        self.padding = 0
        
        self.content = ft.Row([
            self.jobs_card,
            self.apps_card,
            self.tasks_card,
            self.success_card
        ], spacing=0, expand=True)
