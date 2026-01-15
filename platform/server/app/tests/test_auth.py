"""Unit tests for authentication helpers."""

from app.core.security import create_access_token, decode_token
from app.core.hashing import get_password_hash, verify_password


def test_password_hash_roundtrip():
    """Passwords should hash and verify correctly."""
    hashed = get_password_hash("super-secret")
    assert verify_password("super-secret", hashed)
    assert not verify_password("wrong-password", hashed)


def test_jwt_encode_decode_cycle():
    """Tokens created by the helper should decode successfully."""
    token = create_access_token(subject="1234")
    payload = decode_token(token)
    assert payload["sub"] == "1234"

