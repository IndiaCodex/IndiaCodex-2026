from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Integer, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import AllocationStatus
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class YieldAllocation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "yield_allocations"

    strategy: Mapped[str] = mapped_column(String(60))
    amount_lovelace: Mapped[int] = mapped_column(BigInteger)
    # Percent as basis points (7800 = 78.00%) - integers, never floats.
    target_bps: Mapped[int] = mapped_column(Integer)
    status: Mapped[AllocationStatus] = mapped_column(
        Enum(AllocationStatus, native_enum=False, length=20),
        default=AllocationStatus.PENDING,
    )
    tx_hash: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    allocated_by: Mapped[Optional["Uuid"]] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=True
    )


class PoolSnapshot(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "pool_snapshots"

    total_pool_lovelace: Mapped[int] = mapped_column(BigInteger)
    allocated_lovelace: Mapped[int] = mapped_column(BigInteger)
    liquid_lovelace: Mapped[int] = mapped_column(BigInteger)
    snapshot_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
