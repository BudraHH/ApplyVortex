"""
Email Service Interface
Abstract base class for email providers.
"""
from abc import ABC, abstractmethod
from typing import Optional
from playwright.async_api import BrowserContext

class EmailProvider(ABC):
    """Abstract base class for email automation providers."""
    
    @abstractmethod
    async def get_latest_verification_code(self, context: BrowserContext, sender_keyword: str) -> Optional[str]:
        """
        Retrieves the latest verification code from the email provider.
        
        Args:
            context: The Playwright browser context (must be authenticated).
            sender_keyword: Keyword to identify the sender (e.g., "Workday").
            
        Returns:
            The 6-digit verification code string, or None if not found.
        """
        pass
