# app/schemas/auth/token.py

from pydantic import BaseModel, ConfigDict
from typing import Optional
from app.schemas.user.user import UserResponse

class TokenData(BaseModel):
    """
    Schema for data extracted from the JWT token.
    """
    email: Optional[str] = None


class Token(BaseModel):
    """
    Schema for the token details themselves.
    """
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int = 3600

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """
    Full response model for Login/Register endpoints.
    Returns both the token set and the user profile.
    """
    token: Token
    user: UserResponse

    model_config = ConfigDict(from_attributes=True)