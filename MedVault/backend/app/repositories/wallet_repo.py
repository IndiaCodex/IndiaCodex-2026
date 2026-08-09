import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import Wallet
from app.models.wallet_challenge import WalletChallenge


class WalletRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_address(self, address: str) -> Optional[Wallet]:
        result = await self._session.execute(
            select(Wallet).where(Wallet.address == address)
        )
        return result.scalar_one_or_none()

    async def list_for_user(self, user_id: uuid.UUID) -> list[Wallet]:
        result = await self._session.execute(
            select(Wallet).where(Wallet.user_id == user_id).order_by(Wallet.created_at)
        )
        return list(result.scalars())

    async def create_verified(self, user_id: uuid.UUID, address: str) -> Wallet:
        wallet = Wallet(
            user_id=user_id,
            address=address,
            is_verified=True,
            verified_at=datetime.now(timezone.utc),
        )
        self._session.add(wallet)
        await self._session.flush()
        return wallet

    async def store_challenge(
        self, user_id: uuid.UUID, address: str, nonce: str, expires_at: datetime
    ) -> WalletChallenge:
        challenge = WalletChallenge(
            user_id=user_id, address=address, nonce=nonce, expires_at=expires_at
        )
        self._session.add(challenge)
        await self._session.flush()
        return challenge

    async def get_active_challenge(
        self, user_id: uuid.UUID, address: str
    ) -> Optional[WalletChallenge]:
        result = await self._session.execute(
            select(WalletChallenge)
            .where(
                WalletChallenge.user_id == user_id,
                WalletChallenge.address == address,
                WalletChallenge.used_at.is_(None),
            )
            .order_by(WalletChallenge.created_at.desc())
        )
        challenge = result.scalars().first()
        if challenge is None:
            return None
        expires = challenge.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < datetime.now(timezone.utc):
            return None
        return challenge

    async def mark_used(self, challenge: WalletChallenge) -> None:
        challenge.used_at = datetime.now(timezone.utc)
        await self._session.flush()
