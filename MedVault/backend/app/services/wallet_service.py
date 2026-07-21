import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.blockchain.ports import SignatureVerifierPort
from app.core.config import get_settings
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.logging import get_logger
from app.models.user import Wallet
from app.repositories.wallet_repo import WalletRepository

logger = get_logger(__name__)


class WalletService:
    def __init__(self, session: AsyncSession, verifier: SignatureVerifierPort) -> None:
        self._wallets = WalletRepository(session)
        self._verifier = verifier

    async def create_challenge(self, user_id: uuid.UUID, address: str) -> tuple[str, datetime]:
        existing = await self._wallets.get_by_address(address)
        if existing is not None:
            raise ConflictError("This wallet address is already linked to an account.")
        settings = get_settings()
        # secrets.token_hex = cryptographically secure randomness -
        # guessable nonces would defeat the whole scheme.
        nonce = f"medivault-link-{secrets.token_hex(16)}"
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.wallet_challenge_minutes
        )
        await self._wallets.store_challenge(user_id, address, nonce, expires_at)
        return nonce, expires_at

    async def verify_and_link(
        self, user_id: uuid.UUID, address: str, signature: str, key: str
    ) -> Wallet:
        challenge = await self._wallets.get_active_challenge(user_id, address)
        if challenge is None:
            raise UnauthorizedError("No active challenge. Request a new one.")
        if not self._verifier.verify(address, signature, key, challenge.nonce):
            raise UnauthorizedError("Signature verification failed.")
        if await self._wallets.get_by_address(address) is not None:
            raise ConflictError("This wallet address is already linked to an account.")
        await self._wallets.mark_used(challenge)
        wallet = await self._wallets.create_verified(user_id, address)
        logger.info("wallet_linked", user_id=str(user_id), address=address[:16])
        return wallet

    async def list_wallets(self, user_id: uuid.UUID) -> list[Wallet]:
        return await self._wallets.list_for_user(user_id)
