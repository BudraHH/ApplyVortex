"""
Email Service Factory
Returns the appropriate EmailProvider based on the user's email address.
"""
from typing import Dict, Any

from .base import EmailProvider
from .gmail import GmailProvider
from .outlook import OutlookProvider

# Singleton instances
_gmail_provider = GmailProvider()
_outlook_provider = OutlookProvider()

class EmailServiceFactory:
    """Factory for getting email providers."""
    
    @staticmethod
    def get_provider(user_email: str) -> EmailProvider:
        """
        Determines the email provider based on the domain.
        
        Args:
            user_email: The user's email address (e.g., "john@gmail.com")
            
        Returns:
            An instance of EmailProvider (GmailProvider or OutlookProvider).
            Defaults to GmailProvider if unknown (best effort or fallback).
        """
        email_lower = user_email.lower()
        
        if "@outlook" in email_lower or "@hotmail" in email_lower or "@live" in email_lower:
            return _outlook_provider
        else:
            # Default to Gmail for @gmail.com and unknown domains
            return _gmail_provider
