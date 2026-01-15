import flet as ft
from agent.constants import *
from datetime import datetime

class ActivityItem(ft.Container):
    def __init__(self, message, activity_type, time_ago, timestamp):
        super().__init__()
        
        # Color based on activity type
        color_map = {
            "success": BRAND_GREEN,
            "scraping": BRAND_CYAN,
            "warning": BRAND_YELLOW,
            "info": BRAND_CYAN
        }
        dot_color = color_map.get(activity_type, BRAND_CYAN)
        
        self.padding = ft.padding.symmetric(vertical=12, horizontal=15)
        self.border = ft.border.only(bottom=ft.BorderSide(1, DARK_BORDER))
        
        self.content = ft.Row([
            # Dot indicator
            ft.Container(
                width=8,
                height=8,
                bgcolor=dot_color,
                border_radius=4
            ),
            # Message content
            ft.Column([
                ft.Text(message, size=13, color=dot_color, weight=ft.FontWeight.W_500),
                ft.Row([
                    ft.Text(activity_type.upper().replace("_", " "), size=10, color=DARK_MUTED, weight=ft.FontWeight.W_600),
                    ft.Text("•", size=10, color=DARK_MUTED),
                    ft.Text(time_ago, size=10, color=DARK_MUTED)
                ], spacing=8)
            ], spacing=4, expand=True),
            # Timestamp
            ft.Text(timestamp, size=11, color=DARK_MUTED)
        ], spacing=15, vertical_alignment=ft.CrossAxisAlignment.START)

class RecentActivity(ft.Container):
    def __init__(self, page: ft.Page):
        super().__init__()
        self.page = page
        self.expand = True
        
        self.activity_list = ft.Column([], spacing=0, scroll=ft.ScrollMode.AUTO)
        
        self.bgcolor = DARK_CARD
        self.border = ft.border.all(1, DARK_BORDER)
        self.border_radius = 8
        self.padding = 0
        
        # Header
        header = ft.Container(
            content=ft.Row([
                ft.Text("RECENT ACTIVITY", size=11, color=DARK_MUTED, weight=ft.FontWeight.W_600),
                ft.TextButton(
                    "EXPAND",
                    style=ft.ButtonStyle(color=BRAND_CYAN, padding=0)
                )
            ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
            padding=ft.padding.symmetric(horizontal=15, vertical=12),
            border=ft.border.only(bottom=ft.BorderSide(1, DARK_BORDER))
        )
        
        self.content = ft.Column([
            header,
            ft.Container(content=self.activity_list, expand=True, padding=0)
        ], spacing=0, expand=True)
        
        # Add sample activities matching the design
        self._add_sample_activities()
    
    def _add_sample_activities(self):
        activities = [
            ("Resume parsed successfully - extracted 15 skills, 3 experiences", "success", "2M AGO", "04:32:55"),
            ("Scraping job details for: Senior Frontend Developer at TechCorp", "scraping", "JUST NOW", "04:34:02"),
            ("Application blocked by Captcha - human intervention required", "warning", "3M AGO", "04:35:30"),
            ("Found 12 new matching jobs on LinkedIn", "info", "12M AGO", "04:22:40"),
        ]
        
        for msg, type_, time_ago, ts in activities:
            self.activity_list.controls.append(ActivityItem(msg, type_, time_ago, ts))
    
    def add_activity(self, message, activity_type="info"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        item = ActivityItem(message, activity_type, "JUST NOW", timestamp)
        self.activity_list.controls.insert(0, item)
        if len(self.activity_list.controls) > 50:
            self.activity_list.controls.pop()
        self.update()
