# Agent UI: Branding & Logic Specification (Python Flet Edition)

This document provides a comprehensive design specification for implementing the **Agent UI** using the **Flet** framework in Python. It maintains the premium dual-aesthetic (Cursor-Dark/Vercel-Light) transition while mapping web-based styles to Flet controls and properties.

---

## 1. Design Philosophy
The UI is a "Single Page" desktop application style built on **Flutter's** engine via Flet. It emphasizes **clinical precision** and **responsive layout**.

- **Theme Logic**: Managed via `page.theme_mode` and `page.on_theme_change`.
- **Aesthetic**: Architectural borders, high-contrast typography, and explicit color constants.
- **Performance**: Heavy use of `animate_*` properties for smooth state transitions without full re-renders.

---

## 2. Global Color Constants (Python Mapping)

### 2.1 Brand Palette
Primary branding used for accents and highlights.

```python
BRAND_PRIMARY = "#113F67"
BRAND_400     = "#4892D1"  # Dark mode accent
BRAND_500     = "#113F67"  # Light mode accent
```

### 2.2 Theme-Specific Palettes

#### **Dark Mode (Cursor-Inspired)**
| Element | Hex Code | Flet Support |
| :--- | :--- | :--- |
| **Main BG** | `#050505` | `page.bgcolor` |
| **Surface** | `#0A0A0A` | Container `bgcolor` |
| **Card BG** | `#0D0D0D` | Container `bgcolor` |
| **Border** | `ft.colors.with_opacity(0.1, "#FFFFFF")` | `border=ft.border.all(...)` |
| **Text (Main)** | `#E5E5E5` | Text `color` |
| **Text (Muted)**| `#666666` | Text `color` |

#### **Light Mode (Vercel-Inspired)**
| Element | Hex Code | Flet Support |
| :--- | :--- | :--- |
| **Main BG** | `#FFFFFF` | `page.bgcolor` |
| **Surface** | `#FAFAFA` | Container `bgcolor` |
| **Border** | `#EAEAEA` | `border=ft.border.all(...)` |
| **Text (Main)** | `#000000` | Text `color` |
| **Text (Muted)**| `#6B7280` | Text `color` |

---

## 3. Control Architecture & Structure

### 3.1 TitleBar (AppView)
Implemented as a fixed-height `Row` at the top of the main container.
- **Controls**: `ft.Image` (Logo), `ft.Text` (Title), `ft.CircleAvatar` (Status).
- **Window Controls**: Custom `IconButton` set with `hover_color`. 
- **The Red Close Button**: 
  - `icon_color=ft.colors.GREY_600`
  - `hover_color="#CCFF453A"` (Opacified red)
  - `shape=ft.CircleBorder()`

### 3.2 Sidebar (Navigation Rail Style)
A `Column` inside a `Container` with `animate_width`.
- **Logic**: Toggle `width` between `250` (Expanded) and `64` (Collapsed).
- **Items**: `ft.Container` containing a `Row` (Icon + Text).
- **Active State (Light)**: `bgcolor=BRAND_500`, `border_radius=8`, `content.controls[0].color=colors.WHITE`.
- **Active State (Dark)**: `bgcolor=ft.colors.with_opacity(0.05, colors.WHITE)`, border indicator.

### 3.3 StatsGrid (Metric Cards)
A `ft.ResponsiveRow` or `ft.GridView`.
- **Card**: `ft.Container` with `padding=20`, `border_radius=10`.
- **Interactivity**: `on_hover` event to update `border=ft.border.all(1, ft.colors.with_opacity(0.3, BRAND_PRIMARY))`.
- **Typography**: Value should use `size=24`, `weight=ft.FontWeight.BOLD`.

### 3.4 Terminal / Log Console
A `ft.ListView` nested inside a `ft.Container`.
- **Scroll Logic**: `auto_scroll=True` to follow new log entries.
- **Styling**: `font_family="Monospace"`, `size=12`.
- **Log Item**: A `Row` containing a fixed-width `Timestamp Container` and a wrapping `Message Container`.
- **Syntax Highlighting**:
  - `SUCCESS`: `color=ft.colors.EMERALD_500`
  - `ERROR`: `color=ft.colors.RED_500`
  - `INFO`: `color=BRAND_400`

### 3.5 Settings (Configuration)
A scrollable `Column`.
- **Interface Toggles**: `ft.Switch` component.
- **High Visibility Switch (Flet Hack)**:
  - `active_color=BRAND_400`
  - `track_outline_color={ft.ControlState.DEFAULT: ft.colors.with_opacity(0.2, colors.WHITE)}`
  - `thumb_color={ft.ControlState.SELECTED: ft.colors.WHITE, ft.ControlState.DEFAULT: "#444444"}`

---

## 4. Interaction Patterns (Flet Events)

- **Hover Transitions**: Set `animate_opacity=300` and `animate_offset=300` on containers to mimic Tailwind transition classes.
- **Status Signals**: 
  - **Syncing**: An `ft.CircleAvatar` or `ft.Icon` with a `ft.Animation` set to repeat.
  - **Live Dot**: A `ft.Container` with `shape=ft.BoxShape.CIRCLE` and a repeating `opacity` flicker via a background thread or `page.ontick`.

---

## 5. File Layout Strategy
To maintain clean Python code, separate the UI logic from the styling:

1. `constants.py`: Holds all hex codes and theme dictionaries.
2. `styles.py`: Returns `ft.ButtonStyle` and `ft.ContainerStyles`.
3. `components/`: Separate files for `sidebar.py`, `terminal.py`, etc.
4. `main.py`: Sets up the `ft.app(target=main)` and the root `Page` layout.

---
*Created by Antigravity AI for ApplyVortex Agent Interface (Flet Implementation).*
