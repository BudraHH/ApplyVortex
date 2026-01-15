"""Validation helpers."""

from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status


def validate_uuid(value: str) -> UUID:
    """Validate that the provided string is a valid UUID."""
    try:
        return UUID(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UUID provided.",
        ) from exc

