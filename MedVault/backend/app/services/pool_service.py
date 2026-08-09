import secrets
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import AppError, NotFoundError
from app.core.logging import get_logger
from app.models.enums import AllocationStatus, TransactionDirection, TransactionType
from app.models.ledger import AuditLog
from app.models.pool import YieldAllocation
from app.repositories.pool_repo import PoolRepository
from app.schemas.pool import PoolStatus

logger = get_logger(__name__)


class AllocationCapError(AppError):
    status_code = 400
    code = "allocation_cap_exceeded"


class InsufficientLiquidityError(AppError):
    status_code = 409
    code = "insufficient_liquidity"


class PoolService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._pool = PoolRepository(session)

    async def status(self) -> PoolStatus:
        premiums = await self._pool.premiums_in()
        earned = await self._pool.yield_in()
        paid = await self._pool.payouts_out()
        allocated = await self._pool.allocated_active()
        total = premiums + earned - paid
        liquid = total - allocated
        settings = get_settings()
        return PoolStatus(
            total_pool_lovelace=total,
            allocated_lovelace=allocated,
            liquid_lovelace=liquid,
            allocation_cap_bps=settings.allocation_cap_bps,
            current_allocation_bps=(allocated * 10_000 // total) if total > 0 else 0,
            premiums_collected_lovelace=premiums,
            yield_earned_lovelace=earned,
            claims_paid_lovelace=paid,
        )

    async def allocate(
        self, admin_id: uuid.UUID, strategy: str, amount_lovelace: int
    ) -> YieldAllocation:
        settings = get_settings()
        state = await self.status()

        # THE invariant: never deploy beyond the cap. Enforced here in one
        # place - routes can't bypass it, bugs elsewhere can't override it.
        cap = state.total_pool_lovelace * settings.allocation_cap_bps // 10_000
        if state.allocated_lovelace + amount_lovelace > cap:
            headroom = max(0, cap - state.allocated_lovelace)
            raise AllocationCapError(
                f"Allocation would exceed the {settings.allocation_cap_bps / 100:.0f}% "
                f"cap. Headroom: {headroom} lovelace."
            )

        target_bps = (
            (state.allocated_lovelace + amount_lovelace) * 10_000
            // state.total_pool_lovelace
        )
        # Hackathon: simulated strategy deployment tx.
        tx_hash = f"alloc_{secrets.token_hex(16)}"
        allocation = await self._pool.create_allocation(
            strategy, amount_lovelace, target_bps, admin_id, tx_hash
        )
        self._session.add(
            AuditLog(actor_id=admin_id, action="ALLOCATE_FUNDS",
                     entity="allocation", entity_id=str(allocation.id))
        )
        new_state = await self.status()
        await self._pool.snapshot(
            new_state.total_pool_lovelace,
            new_state.allocated_lovelace,
            new_state.liquid_lovelace,
        )
        logger.info("funds_allocated", strategy=strategy, amount=amount_lovelace)
        return allocation

    async def withdraw(self, admin_id: uuid.UUID, allocation_id: uuid.UUID) -> YieldAllocation:
        allocation = await self._pool.get_allocation(allocation_id)
        if allocation is None:
            raise NotFoundError("Allocation not found.")
        if allocation.status != AllocationStatus.ACTIVE:
            raise NotFoundError("Allocation is not active.")
        allocation.status = AllocationStatus.WITHDRAWN
        self._session.add(
            AuditLog(actor_id=admin_id, action="WITHDRAW_ALLOCATION",
                     entity="allocation", entity_id=str(allocation.id))
        )
        await self._session.flush()
        state = await self.status()
        await self._pool.snapshot(
            state.total_pool_lovelace, state.allocated_lovelace, state.liquid_lovelace
        )
        return allocation

    async def list_allocations(self) -> list[YieldAllocation]:
        return await self._pool.list_allocations()

    async def distribute_yield(self, amount_lovelace: int) -> None:
        """Credits earned yield to the pool ledger (called by the yield script)."""
        await self._pool.record_ledger(
            TransactionType.YIELD,
            TransactionDirection.IN,
            amount_lovelace,
            f"yield_{secrets.token_hex(16)}",
        )

    async def require_liquidity(self, amount_lovelace: int) -> None:
        """Guard used by claim payouts: a claim cannot be paid from money that
        doesn't exist, nor from money deployed to strategies."""
        state = await self.status()
        if state.liquid_lovelace >= amount_lovelace:
            return
        if state.allocated_lovelace > 0:
            raise InsufficientLiquidityError(
                f"Payout needs {amount_lovelace / 1_000_000:.0f} ADA liquid but only "
                f"{state.liquid_lovelace / 1_000_000:.0f} ADA is free "
                f"({state.allocated_lovelace / 1_000_000:.0f} ADA is deployed). "
                "Withdraw from a strategy first."
            )
        raise InsufficientLiquidityError(
            f"Payout of {amount_lovelace / 1_000_000:.0f} ADA exceeds the pool "
            f"balance of {state.total_pool_lovelace / 1_000_000:.0f} ADA. "
            "The pool needs more premiums (or yield) before this claim can be paid."
        )
