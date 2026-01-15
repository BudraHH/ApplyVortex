from fastapi import HTTPException, status
from typing import Dict, Any


class ApplyVortexException(HTTPException):
    def __init__(
        self,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        detail: str = "An error occurred",
        headers: Dict[str, Any] | None = None
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)


class AuthException(ApplyVortexException):
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )


class PermissionDenied(ApplyVortexException):
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


class NotFoundException(ApplyVortexException):
    def __init__(self, entity: str = "Resource"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{entity} not found"
        )


class ValidationException(ApplyVortexException):
    def __init__(self, detail: str = "Validation failed"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail
        )


class RateLimitExceeded(ApplyVortexException):
    def __init__(self, detail: str = "Rate limit exceeded"):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
            headers={"Retry-After": "60"}
        )


class DatabaseException(ApplyVortexException):
    def __init__(self, detail: str = "Database error"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail
        )


# Common usage
class UserNotFound(NotFoundException):
    def __init__(self):
        super().__init__("User")


class ResumeNotFound(NotFoundException):
    def __init__(self):
        super().__init__("Resume")


class InvalidCredentials(AuthException):
    def __init__(self):
        super().__init__("Invalid email or password")


class AccountLocked(AuthException):
    def __init__(self):
        super().__init__("Account temporarily locked")
