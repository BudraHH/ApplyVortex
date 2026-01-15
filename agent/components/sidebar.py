import flet as ft
from agent.constants import *

class Sidebar(ft.Container):
    def __init__(self, page: ft.Page, on_change):
        super().__init__()
        self.page = page
        self.on_change = on_change
        self.expanded = True
        self.width = 200
        self.padding = ft.padding.only(left=15, right=15, top=20, bottom=20)
        self.bgcolor = DARK_SURFACE
        
        self.nav_items = [
            ("DASHBOARD", "dashboard_outlined"),
            ("PORTALS", "language_outlined"),
            ("TASKS", "assignment_outlined"),
            ("ACTIVITY LOG", "timeline_outlined"),
            ("SETTINGS", "settings_outlined"),
        ]
        
        self.selected_index = 0
        self.content = self._build_content()

    def _build_content(self):
        # Header with logo and LIVE badge
        header = ft.Container(
            content=ft.Row([
                ft.Container(
                    content=ft.Text("AF", size=14, weight=ft.FontWeight.BOLD, color="#FFFFFF"),
                    width=32,
                    height=32,
                    bgcolor=BRAND_GREEN,
                    border_radius=6,
                    alignment=ft.alignment.center
                ),
                ft.Text("AGENT FORGE CONTROL", size=11, weight=ft.FontWeight.W_600, color=DARK_TEXT, expand=True),
                ft.Container(
                    content=ft.Row([
                        ft.Container(width=6, height=6, bgcolor=BRAND_GREEN, border_radius=3),
                        ft.Text("LIVE", size=9, weight=ft.FontWeight.BOLD, color=BRAND_GREEN)
                    ], spacing=4, alignment=ft.MainAxisAlignment.CENTER),
                    padding=ft.padding.symmetric(horizontal=8, vertical=4),
                    border=ft.border.all(1, BRAND_GREEN),
                    border_radius=4
                )
            ], spacing=10, vertical_alignment=ft.CrossAxisAlignment.CENTER),
            margin=ft.margin.only(bottom=30)
        )
        
        # Navigation items
        nav_controls = []
        for i, (label, icon_name) in enumerate(self.nav_items):
            nav_controls.append(self._build_nav_item(i, label, icon_name))
        
        # Collapse button at bottom
        collapse_button = ft.Container(
            content=ft.Row([
                ft.Icon(ft.icons.CHEVRON_LEFT, size=16, color=DARK_MUTED),
                ft.Text("COLLAPSE", size=11, color=DARK_MUTED, weight=ft.FontWeight.W_500)
            ], spacing=8),
            on_click=lambda _: self.toggle(),
            padding=ft.padding.symmetric(vertical=10),
        )
        
        return ft.Column([
            header,
            ft.Column(nav_controls, spacing=2, expand=True),
            collapse_button
        ], expand=True)

    def _build_nav_item(self, index, label, icon_name):
        is_selected = self.selected_index == index
        
        # Map icon names to Flet icons
        icon_map = {
            "dashboard_outlined": ft.icons.DASHBOARD_OUTLINED,
            "language_outlined": ft.icons.LANGUAGE_OUTLINED,
            "assignment_outlined": ft.icons.ASSIGNMENT_OUTLINED,
            "timeline_outlined": ft.icons.TIMELINE_OUTLINED,
            "settings_outlined": ft.icons.SETTINGS_OUTLINED,
        }
        icon = icon_map.get(icon_name, ft.icons.CIRCLE)
        
        return ft.Container(
            content=ft.Row([
                ft.Icon(icon, color=BRAND_GREEN if is_selected else DARK_MUTED, size=18),
                ft.Text(
                    label,
                    color=DARK_TEXT if is_selected else DARK_MUTED,
                    size=12,
                    weight=ft.FontWeight.W_600 if is_selected else ft.FontWeight.W_500,
                )
            ], spacing=12),
            padding=ft.padding.symmetric(horizontal=12, vertical=10),
            border_radius=8,
            bgcolor=ft.colors.with_opacity(0.1, BRAND_GREEN) if is_selected else ft.colors.TRANSPARENT,
            on_click=lambda _, idx=index: self._handle_click(idx),
            on_hover=lambda e, idx=index: self._handle_hover(e, idx),
        )

    def _handle_click(self, index):
        self.selected_index = index
        self.content = self._build_content()
        self.update()
        if self.on_change:
            view_map = ["dashboard", "portals", "tasks", "activity", "settings"]
            self.on_change(view_map[index])

    def _handle_hover(self, e, index):
        if self.selected_index != index:
            if e.data == "true":
                e.control.bgcolor = ft.colors.with_opacity(0.05, "#FFFFFF")
            else:
                e.control.bgcolor = ft.colors.TRANSPARENT
            e.control.update()

    def toggle(self):
        self.expanded = not self.expanded
        self.width = 200 if self.expanded else 64
        self.content = self._build_content()
        self.update()
