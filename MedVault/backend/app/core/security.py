import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Literal, Optional

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.core.config import get_settings

# Argon2id with library defaults - the OWASP-recommended algorithm.
# Hashing is intentionally slow (~50ms): irrelevant per login,
# devastating for someone brute-forcing a stolen database.
_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return _hasher.verify(hashed, password)
    except VerifyMismatchError:
        return False


TokenType = Literal["access", "refresh"]


def _create_token(
    subject: str, token_type: TokenType, expires_delta: timedelta
) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,          # whom the token is about (user id)
        "type": token_type,      # access tokens can't be replayed as refresh
        "iat": now,              # issued-at
        "exp": now + expires_delta,
        "jti": uuid.uuid4().hex, # unique token id -> enables revocation
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def create_access_token(user_id: str) -> str:
    settings = get_settings()
    return _create_token(
        user_id, "access", timedelta(minutes=settings.access_token_minutes)
    )


def create_refresh_token(user_id: str) -> str:
    settings = get_settings()
    return _create_token(
        user_id, "refresh", timedelta(days=settings.refresh_token_days)
    )


def decode_token(token: str, expected_type: TokenType) -> Optional[dict[str, Any]]:
    """Returns the payload if the token is valid and of the expected type."""
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    if payload.get("type") != expected_type:
        return None
    return payload


def sha256_hex(value: str) -> str:
    """Refresh tokens are stored hashed - a leaked DB must not yield
    usable tokens, same principle as passwords."""
    return hashlib.sha256(value.encode()).hexdigest()
