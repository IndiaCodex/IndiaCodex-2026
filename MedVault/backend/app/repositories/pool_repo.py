import uuid
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import (
    AllocationStatus,
    PaymentStatus,
    TransactionDirection,
    TransactionType,
)
from app.models.ledger import Transaction
from app.models.pool import PoolSnapshot, YieldAllocation


class PoolRepository:
    """Pool state is DERIVED from the transaction ledger, never stored as a
    mutable 'balance' field. A balance column can silently drift from the
    truth; a ledger sum cannot."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def _sum(self, tx_type: TransactionType) -> int:
        result = await self._session.execute(
            select(func.coalesce(func.sum(Transaction.amount_lovelace), 0)).where(
                Transaction.type == tx_type,
                Transaction.status == PaymentStatus.CONFIRMED,
            )
        )
        return int(result.scalar_one())

    async def premiums_in(self) -> int:
        return await self._sum(TransactionType.PREMIUM)

    async def yield_in(self) -> int:
        return await self._sum(TransactionType.YIELD)

    async def payouts_out(self) -> int:
        return await self._sum(TransactionType.PAYOUT)

    async def allocated_active(self) -> int:
        result = await self._session.execute(
            select(
                func.coalesce(func.sum(YieldAllocation.amount_lovelace), 0)
            ).where(YieldAllocation.status == AllocationStatus.ACTIVE)
        )
        return int(result.scalar_one())

    async def get_allocation(self, allocation_id: uuid.UUID) -> Optional[YieldAllocation]:
        return await self._session.get(YieldAllocation, allocation_id)

    async def list_allocations(self) -> list[YieldAllocation]:
        result = await self._session.execute(
            select(YieldAllocation).order_by(YieldAllocation.created_at.desc())
        )
        return list(result.scalars())

    async def create_allocation(
        self, strategy: str, amount_lovelace: int, target_bps: int,
        allocated_by: uuid.UUID, tx_hash: str,
    ) -> YieldAllocation:
        allocation = YieldAllocation(
            strategy=strategy,
            amount_lovelace=amount_lovelace,
            target_bps=target_bps,
            status=AllocationStatus.ACTIVE,
            tx_hash=tx_hash,
            allocated_by=allocated_by,
        )
        self._session.add(allocation)
        await self._session.flush()
        return allocation

    async def snapshot(self, total: int, allocated: int, liquid: int) -> None:
        self._session.add(
            PoolSnapshot(
                total_pool_lovelace=total,
                allocated_lovelace=allocated,
                liquid_lovelace=liquid,
            )
        )
        await self._session.flush()

    async def record_ledger(
        self, tx_type: TransactionType, direction: TransactionDirection,
        amount_lovelace: int, tx_hash: str,
    ) -> None:
        self._session.add(
            Transaction(
                user_id=None,
                type=tx_type,
                direction=direction,
                amount_lovelace=amount_lovelace,
                tx_hash=tx_hash,
                status=PaymentStatus.CONFIRMED,
            )
        )
        await self._session.flush()
