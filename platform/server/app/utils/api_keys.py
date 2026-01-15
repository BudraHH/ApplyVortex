"""
API Key Utilities
Functions for generating, hashing, and validating agent API keys.
"""
import secrets
import hashlib
from passlib.context import CryptContext

# Use bcrypt for hashing API keys
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

API_KEY_PREFIX = "apf_agent_"
API_KEY_LENGTH = 32  # Random part length


def generate_api_key() -> str:
    """
    Generate a secure random API key.
    
    Format: apf_agent_<32_random_chars>
    Example: apf_agent_a3f4b2c1d5e6f7g8h9i0j1k2l3m4n5o6
    
    Returns:
        Full API key string
    """
    random_part = secrets.token_urlsafe(API_KEY_LENGTH)[:API_KEY_LENGTH]
    return f"{API_KEY_PREFIX}{random_part}"


def hash_api_key(api_key: str) -> str:
    """
    Hash an API key for secure storage.
    
    Args:
        api_key: The plain API key
    
    Returns:
        Bcrypt hash of the key
    """
    return pwd_context.hash(api_key)


def verify_api_key(plain_key: str, hashed_key: str) -> bool:
    """
    Verify an API key against its hash.
    
    Args:
        plain_key: The plain API key to verify
        hashed_key: The stored hash
    
    Returns:
        True if key matches, False otherwise
    """
    return pwd_context.verify(plain_key, hashed_key)


def get_key_prefix(api_key: str) -> str:
    """
    Extract the display prefix from an API key.
    
    Args:
        api_key: Full API key
    
    Returns:
        First 12 characters for display (e.g., "apf_agent_a3f")
    """
    return api_key[:16] if len(api_key) >= 16 else api_key


def validate_api_key_format(api_key: str) -> bool:
    """
    Validate that an API key has the correct format.
    
    Args:
        api_key: The key to validate
    
    Returns:
        True if format is valid, False otherwise
    """
    # Allow flexible format for now to support email-based user keys and legacy/test keys
    # Just check minimum security length
    if len(api_key) < 20:
        return False
        
    # Optional: If it STARTS with apf_agent_, we can enforce stricter rules if we want,
    # but for now, let's keep it open to avoid breaking the email_at_token format.
    
    return True
