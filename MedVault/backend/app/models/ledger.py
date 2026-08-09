from typing import Optional

from sqlalchemy import JSON, BigInteger, Enum, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import PaymentStatus, TransactionDirection, TransactionType
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Transaction(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Unified money-movement history (one row per movement)."""

    __tablename__ = "transactions"

    user_id: Mapped[Optional["Uuid"]] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=True, index=True
    )
    type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType, native_enum=False, length=20)
    )
    direction: Mapped[TransactionDirection] = mapped_column(
        Enum(TransactionDirection, native_enum=False, length=5)
    )
    amount_lovelace: Mapped[int] = mapped_column(BigInteger)
    tx_hash: Mapped[Optional[str]] = mapped_column(String(120), nullable=True, index=True)
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, native_enum=False, length=20),
        default=PaymentStatus.PENDING,
    )


class AuditLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Who did what, when - append-only. Required for a financial product."""

    __tablename__ = "audit_logs"

    actor_id: Mapped[Optional["Uuid"]] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(60), index=True)
    entity: Mapped[str] = mapped_column(String(60))
    entity_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    context: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
