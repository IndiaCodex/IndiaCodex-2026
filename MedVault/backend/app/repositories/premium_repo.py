import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import (
    PaymentStatus,
    TransactionDirection,
    TransactionType,
)
from app.models.insurance import Policy, PremiumPayment
from app.models.ledger import Transaction


class PremiumRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_tx_hash(self, tx_hash: str) -> Optional[PremiumPayment]:
        result = await self._session.execute(
            select(PremiumPayment).where(PremiumPayment.tx_hash == tx_hash)
        )
        return result.scalar_one_or_none()

    async def list_for_user(self, user_id: uuid.UUID) -> list[PremiumPayment]:
        result = await self._session.execute(
            select(PremiumPayment)
            .join(Policy)
            .where(Policy.user_id == user_id)
            .order_by(PremiumPayment.created_at.desc())
        )
        return list(result.scalars())

    async def create_confirmed(
        self, policy_id: uuid.UUID, amount_lovelace: int, tx_hash: str
    ) -> PremiumPayment:
        payment = PremiumPayment(
            policy_id=policy_id,
            amount_lovelace=amount_lovelace,
            tx_hash=tx_hash,
            status=PaymentStatus.CONFIRMED,
            confirmed_at=datetime.now(timezone.utc),
        )
        self._session.add(payment)
        await self._session.flush()
        return payment

    async def record_transaction(
        self, user_id: uuid.UUID, amount_lovelace: int, tx_hash: str
    ) -> None:
        self._session.add(
            Transaction(
                user_id=user_id,
                type=TransactionType.PREMIUM,
                direction=TransactionDirection.IN,
                amount_lovelace=amount_lovelace,
                tx_hash=tx_hash,
                status=PaymentStatus.CONFIRMED,
            )
        )
        await self._session.flush()
