"""
Utility functions for parsing user agent strings and device information.
"""
from typing import Dict, Optional
import re


def parse_user_agent(user_agent: Optional[str]) -> Dict[str, str]:
    """
    Parse user agent string to extract browser, OS, and device info.
    
    Returns:
        dict with keys: browser, browser_version, os, os_version, device_type
    """
    if not user_agent:
        return {
            "browser": "Unknown",
            "browser_version": "",
            "os": "Unknown",
            "os_version": "",
            "device_type": "desktop"
        }
    
    ua_lower = user_agent.lower()
    
    # Detect device type
    device_type = "desktop"
    if any(mobile in ua_lower for mobile in ["mobile", "android", "iphone", "ipad", "ipod"]):
        device_type = "mobile"
    elif "tablet" in ua_lower or "ipad" in ua_lower:
        device_type = "tablet"
    
    # Detect browser
    browser = "Unknown"
    browser_version = ""
    
    # Order matters - check more specific browsers first
    if "edg/" in ua_lower or "edge/" in ua_lower:
        browser = "Edge"
        match = re.search(r'edg[e]?/(\d+\.?\d*)', ua_lower)
        if match:
            browser_version = match.group(1)
    elif "opr/" in ua_lower or "opera" in ua_lower:
        browser = "Opera"
        match = re.search(r'opr/(\d+\.?\d*)', ua_lower)
        if match:
            browser_version = match.group(1)
    elif "chrome" in ua_lower and "safari" in ua_lower:
        browser = "Chrome"
        match = re.search(r'chrome/(\d+\.?\d*)', ua_lower)
        if match:
            browser_version = match.group(1)
    elif "firefox" in ua_lower:
        browser = "Firefox"
        match = re.search(r'firefox/(\d+\.?\d*)', ua_lower)
        if match:
            browser_version = match.group(1)
    elif "safari" in ua_lower:
        browser = "Safari"
        match = re.search(r'version/(\d+\.?\d*)', ua_lower)
        if match:
            browser_version = match.group(1)
    
    # Detect OS
    os = "Unknown"
    os_version = ""
    
    if "windows" in ua_lower:
        os = "Windows"
        if "windows nt 10.0" in ua_lower:
            os_version = "10/11"
        elif "windows nt 6.3" in ua_lower:
            os_version = "8.1"
        elif "windows nt 6.2" in ua_lower:
            os_version = "8"
        elif "windows nt 6.1" in ua_lower:
            os_version = "7"
    elif "mac os x" in ua_lower or "macos" in ua_lower:
        os = "macOS"
        match = re.search(r'mac os x (\d+[._]\d+)', ua_lower)
        if match:
            os_version = match.group(1).replace('_', '.')
    elif "android" in ua_lower:
        os = "Android"
        match = re.search(r'android (\d+\.?\d*)', ua_lower)
        if match:
            os_version = match.group(1)
    elif "iphone" in ua_lower or "ipad" in ua_lower or "ipod" in ua_lower:
        os = "iOS"
        match = re.search(r'os (\d+[._]\d+)', ua_lower)
        if match:
            os_version = match.group(1).replace('_', '.')
    elif "linux" in ua_lower:
        os = "Linux"
        if "ubuntu" in ua_lower:
            os = "Ubuntu"
        elif "fedora" in ua_lower:
            os = "Fedora"
    
    return {
        "browser": browser,
        "browser_version": browser_version,
        "os": os,
        "os_version": os_version,
        "device_type": device_type
    }


def generate_device_name(user_agent: Optional[str]) -> str:
    """
    Generate a friendly device name from user agent.
    
    Examples:
        "Chrome on Windows"
        "Safari on iPhone"
        "Firefox on Ubuntu"
    """
    parsed = parse_user_agent(user_agent)
    
    browser = parsed["browser"]
    os = parsed["os"]
    
    # For mobile devices, be more specific
    if parsed["device_type"] == "mobile":
        if "iphone" in (user_agent or "").lower():
            return f"{browser} on iPhone"
        elif "ipad" in (user_agent or "").lower():
            return f"{browser} on iPad"
        elif "android" in (user_agent or "").lower():
            return f"{browser} on Android"
        else:
            return f"{browser} on Mobile"
    
    # For desktop
    return f"{browser} on {os}"
