"""Abstract base class for portal-specific automation strategies."""

import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from playwright.async_api import Page
from pathlib import Path
from datetime import datetime
from agent.core.browser_service import FileUploadHandler

class PortalStrategy(ABC):
    """Abstract base class for portal-specific automation strategies."""
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.file_upload_handler = FileUploadHandler()
    
    @abstractmethod
    async def apply(self, page: Page, user: Dict[str, Any], resume_path: str) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    def can_handle(self, url: str) -> bool:
        pass
    
    async def take_screenshot(self, page: Page, name: str) -> str:
        try:
            path = Path("screenshots") / f"{name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.png"
            path.parent.mkdir(parents=True, exist_ok=True)
            await page.screenshot(path=str(path), full_page=True)
            return str(path)
        except Exception: return ""
