import flet as ft
from agent.components.stats_grid import StatsGrid
from agent.components.activity import RecentActivity
from agent.components.terminal import Terminal
from agent.constants import *

class DashboardView(ft.Column):
    def __init__(self, page: ft.Page):
        super().__init__()
        self.page = page
        self.spacing = 20
        self.expand = True
        
        self.stats_grid = StatsGrid(page)
        self.activity = RecentActivity(page)
        self.terminal = Terminal(page)
        
        self.controls = [
            self.stats_grid,
            self.activity,
            self.terminal
        ]
    
    def add_activity(self, message, activity_type="info"):
        self.activity.add_activity(message, activity_type)
