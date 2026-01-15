import os
import sys
import platform
import logging

logger = logging.getLogger("AgentForge.Startup")

APP_NAME = "applyvortex-agent"
DESKTOP_FILE_CONTENT = """[Desktop Entry]
Type=Application
Exec={python_path} {script_path}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Name=ApplyVortex Agent
Comment=Auto-start ApplyVortex Agent
Terminal=false
"""

def get_autostart_path():
    """Get the path to the autostart directory on Linux."""
    return os.path.expanduser("~/.config/autostart")

def get_desktop_file_path():
    """Get the full path to the .desktop file."""
    return os.path.join(get_autostart_path(), f"{APP_NAME}.desktop")

def is_startup_enabled():
    """Check if startup is currently enabled."""
    if platform.system() != "Linux":
        return False
    return os.path.exists(get_desktop_file_path())

def enable_startup():
    """Enable launch on startup for Linux."""
    if platform.system() != "Linux":
        logger.warning("Startup configuration is only implemented for Linux.")
        return False

    try:
        autostart_dir = get_autostart_path()
        if not os.path.exists(autostart_dir):
            os.makedirs(autostart_dir)

        desktop_file = get_desktop_file_path()
        
        # Get absolute paths
        python_path = sys.executable
        # Get path to main.py. Assuming this is run from agent/main.py
        # We need to find main.py relative to this file or CWD?
        # Best is to use the absolute path of the script named 'main.py' in the parent-parent directory?
        # Actually sys.argv[0] usually contains the script path.
        # But if imported, we need to be careful.
        # Let's assume the standard layout: agent/main.py
        
        # Determine script path correctly
        # utils/startup.py -> utils/ -> agent/ -> agent/main.py
        current_dir = os.path.dirname(os.path.abspath(__file__))
        agent_dir = os.path.dirname(current_dir)
        script_path = os.path.join(agent_dir, "main.py")
        
        if not os.path.exists(script_path):
            logger.error(f"Could not find main.py at {script_path}")
            return False

        content = DESKTOP_FILE_CONTENT.format(
            python_path=python_path,
            script_path=script_path
        )

        with open(desktop_file, "w") as f:
            f.write(content)
        
        logger.info(f"Startup enabled. Created {desktop_file}")
        return True

    except Exception as e:
        logger.error(f"Failed to enable startup: {e}")
        return False

def disable_startup():
    """Disable launch on startup for Linux."""
    if platform.system() != "Linux":
        return False

    try:
        desktop_file = get_desktop_file_path()
        if os.path.exists(desktop_file):
            os.remove(desktop_file)
            logger.info(f"Startup disabled. Removed {desktop_file}")
            return True
        return True # Already disabled
    except Exception as e:
        logger.error(f"Failed to disable startup: {e}")
        return False
