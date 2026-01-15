import flet as ft
from agent.constants import *

def get_container_style(theme_mode: ft.ThemeMode, is_card=False):
    if theme_mode == ft.ThemeMode.DARK:
        return {
            "bgcolor": DARK_CARD if is_card else DARK_SURFACE,
            "border": ft.border.all(1, DARK_BORDER),
            "border_radius": 10
        }
    else:
        return {
            "bgcolor": LIGHT_SURFACE,
            "border": ft.border.all(1, LIGHT_BORDER),
            "border_radius": 10
        }

def get_text_style(theme_mode: ft.ThemeMode, is_muted=False, is_bold=False, size=14):
    color = (DARK_MUTED if is_muted else DARK_TEXT) if theme_mode == ft.ThemeMode.DARK else (LIGHT_MUTED if is_muted else LIGHT_TEXT)
    weight = ft.FontWeight.BOLD if is_bold else ft.FontWeight.NORMAL
    return ft.TextStyle(color=color, size=size, weight=weight, font_family=FONT_UI)

def get_button_style(theme_mode: ft.ThemeMode):
    # Custom button styles can be added here
    pass
