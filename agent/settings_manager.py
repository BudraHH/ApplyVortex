"""
Settings Manager for ApplyVortex Agent
Handles persistent settings and OS-level configurations like:
- Browser visibility (headless mode)
- Background persistence (tray functionality)
- Login auto-start (startup registration)
- GPU acceleration
"""
import os
import sys
import json
import platform
import logging
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger("AgentForge.Settings")


class SettingsManager:
    """
    Manages agent settings with persistence and OS-level integration.
    """
    
    # Default settings
    DEFAULTS = {
        "theme": "dark",
        "auto_start": False,
        "background_persistence": True,
        "browser_visibility": False,
        "gpu_acceleration": True,
    }
    
    def __init__(self):
        self.settings = self.DEFAULTS.copy()
        self._settings_path = self._get_settings_path()
        self._load_settings()
        
        # Apply initial settings
        self._apply_all_settings()
    
    @property
    def settings_file(self) -> str:
        """Return settings file path as string (for compatibility)."""
        return str(self._settings_path)
    
    def _get_settings_path(self) -> Path:
        """Get the path to the settings file."""
        if platform.system() == "Windows":
            app_data = os.environ.get("APPDATA", os.path.expanduser("~"))
            settings_dir = Path(app_data) / "ApplyVortex"
        elif platform.system() == "Darwin":  # macOS
            settings_dir = Path.home() / "Library" / "Application Support" / "ApplyVortex"
        else:  # Linux
            settings_dir = Path.home() / ".config" / "applyvortex"
        
        settings_dir.mkdir(parents=True, exist_ok=True)
        return settings_dir / "settings.json"
    
    def _load_settings(self):
        """Load settings from file."""
        try:
            if self._settings_path.exists():
                with open(self._settings_path, "r") as f:
                    saved = json.load(f)
                    self.settings.update(saved)
                logger.info(f"Settings loaded from {self._settings_path}")
        except Exception as e:
            logger.warning(f"Failed to load settings: {e}")
    
    def _save_settings(self):
        """Save settings to file."""
        try:
            with open(self._settings_path, "w") as f:
                json.dump(self.settings, f, indent=2)
            logger.debug(f"Settings saved to {self._settings_path}")
        except Exception as e:
            logger.error(f"Failed to save settings: {e}")
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get a setting value."""
        return self.settings.get(key, default)
    
    def set(self, key: str, value: Any) -> Dict[str, Any]:
        """Set a setting value and apply it."""
        if key not in self.settings:
            return {"success": False, "error": f"Unknown setting: {key}"}
        
        old_value = self.settings[key]
        self.settings[key] = value
        self._save_settings()
        
        # Apply the setting
        result = self._apply_setting(key, value)
        
        logger.info(f"Setting changed: {key} = {value} (was: {old_value})")
        return {"success": True, "key": key, "value": value, "applied": result}
    
    def get_all(self) -> Dict[str, Any]:
        """Get all settings."""
        return self.settings.copy()
    
    def _apply_all_settings(self):
        """Apply all settings on startup."""
        for key, value in self.settings.items():
            try:
                self._apply_setting(key, value)
            except Exception as e:
                logger.warning(f"Failed to apply setting {key}: {e}")
    
    def _apply_setting(self, key: str, value: Any) -> bool:
        """Apply a single setting."""
        try:
            if key == "browser_visibility":
                return self._apply_browser_visibility(value)
            elif key == "auto_start":
                return self._apply_auto_start(value)
            elif key == "background_persistence":
                return self._apply_background_persistence(value)
            elif key == "gpu_acceleration":
                return self._apply_gpu_acceleration(value)
            elif key == "theme":
                # Theme is handled by React
                return True
            return False
        except Exception as e:
            logger.error(f"Error applying setting {key}: {e}")
            return False
    
    # ============ BROWSER VISIBILITY ============
    
    def _apply_browser_visibility(self, visible: bool) -> bool:
        """
        Control browser visibility (headless mode).
        When visible=True, browser windows are shown during automation.
        When visible=False, browser runs in headless mode.
        """
        try:
            from config import settings as app_settings
            app_settings.HEADLESS = not visible
            logger.info(f"Browser visibility set to: {visible} (HEADLESS={not visible})")
            return True
        except ImportError:
            logger.warning("Could not import config.settings")
            return False
    
    # ============ LOGIN AUTO-START ============
    
    def _apply_auto_start(self, enabled: bool) -> bool:
        """
        Enable/disable auto-start on system login.
        """
        system = platform.system()
        
        try:
            if system == "Windows":
                return self._set_windows_autostart(enabled)
            elif system == "Linux":
                return self._set_linux_autostart(enabled)
            elif system == "Darwin":
                return self._set_macos_autostart(enabled)
            else:
                logger.warning(f"Auto-start not supported on {system}")
                return False
        except Exception as e:
            logger.error(f"Failed to set auto-start: {e}")
            return False
    
    def _set_windows_autostart(self, enabled: bool) -> bool:
        """Set Windows auto-start via Registry."""
        try:
            import winreg
            
            key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
            app_name = "ApplyVortexAgent"
            
            # Get the executable path
            if getattr(sys, 'frozen', False):
                # Running as compiled executable
                exe_path = sys.executable
            else:
                # Running as script
                exe_path = f'"{sys.executable}" "{os.path.abspath("main.py")}"'
            
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE)
            
            if enabled:
                winreg.SetValueEx(key, app_name, 0, winreg.REG_SZ, exe_path)
                logger.info("Windows auto-start enabled")
            else:
                try:
                    winreg.DeleteValue(key, app_name)
                    logger.info("Windows auto-start disabled")
                except FileNotFoundError:
                    pass  # Already not registered
            
            winreg.CloseKey(key)
            return True
        except Exception as e:
            logger.error(f"Windows auto-start error: {e}")
            return False
    
    def _set_linux_autostart(self, enabled: bool) -> bool:
        """Set Linux auto-start via .desktop file."""
        autostart_dir = Path.home() / ".config" / "autostart"
        desktop_file = autostart_dir / "applyvortex-agent.desktop"
        
        if enabled:
            autostart_dir.mkdir(parents=True, exist_ok=True)
            
            # Get executable path
            if getattr(sys, 'frozen', False):
                exe_path = sys.executable
            else:
                exe_path = f"{sys.executable} {os.path.abspath('main.py')}"
            
            desktop_content = f"""[Desktop Entry]
Type=Application
Name=ApplyVortex Agent
Comment=Job Application Automation Agent
Exec={exe_path}
Icon=applyvortex
Terminal=false
StartupNotify=false
Categories=Utility;
X-GNOME-Autostart-enabled=true
"""
            desktop_file.write_text(desktop_content)
            logger.info(f"Linux auto-start enabled: {desktop_file}")
        else:
            if desktop_file.exists():
                desktop_file.unlink()
                logger.info("Linux auto-start disabled")
        
        return True
    
    def _set_macos_autostart(self, enabled: bool) -> bool:
        """Set macOS auto-start via Login Items (launchd plist)."""
        plist_dir = Path.home() / "Library" / "LaunchAgents"
        plist_file = plist_dir / "com.applyvortex.agent.plist"
        
        if enabled:
            plist_dir.mkdir(parents=True, exist_ok=True)
            
            if getattr(sys, 'frozen', False):
                exe_path = sys.executable
                args = [exe_path]
            else:
                args = [sys.executable, os.path.abspath("main.py")]
            
            plist_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.applyvortex.agent</string>
    <key>ProgramArguments</key>
    <array>
        {''.join(f'<string>{arg}</string>' for arg in args)}
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
</dict>
</plist>
"""
            plist_file.write_text(plist_content)
            os.system(f"launchctl load {plist_file}")
            logger.info(f"macOS auto-start enabled: {plist_file}")
        else:
            if plist_file.exists():
                os.system(f"launchctl unload {plist_file}")
                plist_file.unlink()
                logger.info("macOS auto-start disabled")
        
        return True
    
    # ============ BACKGROUND PERSISTENCE ============
    
    def _apply_background_persistence(self, enabled: bool) -> bool:
        """
        Enable/disable background persistence (run in tray when window closed).
        This is handled by the GUI layer - we just store the preference.
        """
        # The actual tray functionality is implemented in webview_gui.py
        # This method just ensures the setting is stored
        logger.info(f"Background persistence set to: {enabled}")
        return True
    
    # ============ GPU ACCELERATION ============
    
    def _apply_gpu_acceleration(self, enabled: bool) -> bool:
        """
        Enable/disable GPU acceleration for Qt rendering.
        Must be called before Qt is initialized to have full effect.
        """
        try:
            if enabled:
                # Enable hardware acceleration
                os.environ.pop("QT_QUICK_BACKEND", None)
                os.environ.pop("QTWEBENGINE_DISABLE_GPU", None)
                os.environ.pop("QT_OPENGL", None)
            else:
                # Disable hardware acceleration
                os.environ["QT_QUICK_BACKEND"] = "software"
                os.environ["QTWEBENGINE_DISABLE_GPU"] = "1"
                os.environ["QT_OPENGL"] = "software"
            
            logger.info(f"GPU acceleration set to: {enabled}")
            return True
        except Exception as e:
            logger.error(f"Failed to set GPU acceleration: {e}")
            return False


# Global settings instance
settings_manager = SettingsManager()
