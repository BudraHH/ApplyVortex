"""Schema-centric tests for user payloads."""

import pytest

from app.schemas.user import UserProfileUpdate
from app.utils.validators import validate_uuid


def test_profile_update_dump():
    """Ensure unset fields are excluded properly."""
    payload = UserProfileUpdate(name="Alex", github_url="https://github.com/alex")
    data = payload.model_dump(exclude_unset=True)
    assert data["name"] == "Alex"
    assert str(data["github_url"]) == "https://github.com/alex"
    assert "current_location" not in data


def test_validate_uuid_success():
    """Validator should return UUID objects for valid inputs."""
    value = validate_uuid("12345678-1234-5678-1234-567812345678")
    assert str(value) == "12345678-1234-5678-1234-567812345678"


def test_validate_uuid_failure():
    """Validator should raise when invalid strings are provided."""
    with pytest.raises(Exception):
        validate_uuid("invalid-uuid")

