import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.logging import get_logger
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    sha256_hex,
    verify_password,
)
from app.models.user import User
from app.repositories.token_repo import RefreshTokenRepository
from app.repositories.user_repo import UserRepository
from app.schemas.auth import TokenPair

logger = get_logger(__name__)


class AuthService:
    """Business rules for authentication. No HTTP, no SQL - just rules."""

    def __init__(self, session: AsyncSession) -> None:
        self._users = UserRepository(session)
        self._tokens = RefreshTokenRepository(session)

    async def register(self, email: str, password: str) -> User:
        if await self._users.get_by_email(email) is not None:
            raise ConflictError("An account with this email already exists.")
        user = await self._users.create(email, hash_password(password))
        logger.info("user_registered", user_id=str(user.id))
        return user

    async def login(self, email: str, password: str) -> TokenPair:
        user = await self._users.get_by_email(email)
        # Same error for wrong email and wrong password - never reveal
        # which one failed, or attackers can enumerate accounts.
        if user is None or not verify_password(password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password.")
        if not user.is_active:
            raise UnauthorizedError("This account is disabled.")
        logger.info("user_logged_in", user_id=str(user.id))
        return await self._issue_pair(user.id)

    async def refresh(self, refresh_token: str) -> TokenPair:
        payload = decode_token(refresh_token, expected_type="refresh")
        if payload is None:
            raise UnauthorizedError("Invalid or expired refresh token.")
        stored = await self._tokens.get_active(sha256_hex(refresh_token))
        if stored is None:
            raise UnauthorizedError("Refresh token is no longer valid.")
        # Rotation: burn the old token, issue a fresh pair.
        await self._tokens.revoke(stored)
        return await self._issue_pair(uuid.UUID(payload["sub"]))

    async def _issue_pair(self, user_id: uuid.UUID) -> TokenPair:
        settings = get_settings()
        access = create_access_token(str(user_id))
        refresh = create_refresh_token(str(user_id))
        await self._tokens.store(
            user_id=user_id,
            token_hash=sha256_hex(refresh),
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.refresh_token_days),
        )
        return TokenPair(access_token=access, refresh_token=refresh)
