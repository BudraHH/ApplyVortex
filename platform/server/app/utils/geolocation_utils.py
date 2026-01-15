"""
Utility functions for IP geolocation.
"""
from typing import Dict, Optional
import httpx
import logging

logger = logging.getLogger(__name__)


async def get_location_from_ip(ip_address: Optional[str]) -> Dict[str, Optional[str]]:
    """
    Get country and city from IP address using ip-api.com (free, no API key needed).
    
    Returns:
        dict with keys: country, city
    """
    if not ip_address or ip_address in ["127.0.0.1", "localhost", "::1"]:
        return {"country": None, "city": None}
    
    try:
        # Use ip-api.com free tier (no API key required)
        # Limit: 45 requests per minute
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"http://ip-api.com/json/{ip_address}",
                params={"fields": "status,country,city"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    return {
                        "country": data.get("country"),
                        "city": data.get("city")
                    }
    except Exception as e:
        logger.warning(f"Failed to get location for IP {ip_address}: {e}")
    
    return {"country": None, "city": None}


def get_location_from_ip_sync(ip_address: Optional[str]) -> Dict[str, Optional[str]]:
    """
    Synchronous version of get_location_from_ip.
    Use this if you can't use async.
    """
    import requests
    
    if not ip_address or ip_address in ["127.0.0.1", "localhost", "::1"]:
        return {"country": None, "city": None}
    
    try:
        response = requests.get(
            f"http://ip-api.com/json/{ip_address}",
            params={"fields": "status,country,city"},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                return {
                    "country": data.get("country"),
                    "city": data.get("city")
                }
    except Exception as e:
        logger.warning(f"Failed to get location for IP {ip_address}: {e}")
    
    return {"country": None, "city": None}
