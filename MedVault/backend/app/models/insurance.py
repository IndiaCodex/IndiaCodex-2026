from datetime import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ClaimStatus, PaymentStatus, PolicyStatus
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.user import User


class InsurancePlan(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "insurance_plans"

    name: Mapped[str] = mapped_column(String(80), unique=True)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    # All money is BIGINT lovelace (1 ADA = 1_000_000 lovelace).
    # Never floats: floats lose pennies; lost pennies lose lawsuits.
    coverage_lovelace: Mapped[int] = mapped_column(BigInteger)
    premium_lovelace: Mapped[int] = mapped_column(BigInteger)
    period_days: Mapped[int] = mapped_column(Integer, default=30)
    max_claims_per_year: Mapped[int] = mapped_column(Integer, default=12)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Policy(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "policies"

    user_id: Mapped["Uuid"] = mapped_column(Uuid, ForeignKey("users.id"), index=True)
    plan_id: Mapped["Uuid"] = mapped_column(Uuid, ForeignKey("insurance_plans.id"))
    status: Mapped[PolicyStatus] = mapped_column(
        Enum(PolicyStatus, native_enum=False, length=20),
        default=PolicyStatus.PENDING,
        index=True,
    )
    # The ONLY privacy artifact we store: an opaque commitment registered on
    # (mock) Midnight. Our DB cannot link it to any medical fact.
    commitment_hash: Mapped[str] = mapped_column(String(130), unique=True)
    start_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    next_premium_due: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped[User] = relationship(back_populates="policies")
    plan: Mapped[InsurancePlan] = relationship()
    payments: Mapped[list["PremiumPayment"]] = relationship(back_populates="policy")
    claims: Mapped[list["Claim"]] = relationship(back_populates="policy")


class PremiumPayment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "premium_payments"

    policy_id: Mapped["Uuid"] = mapped_column(
        Uuid, ForeignKey("policies.id"), index=True
    )
    amount_lovelace: Mapped[int] = mapped_column(BigInteger)
    # Unique => the same on-chain deposit can never be credited twice.
    tx_hash: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, native_enum=False, length=20),
        default=PaymentStatus.PENDING,
    )
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    policy: Mapped[Policy] = relationship(back_populates="payments")


class Claim(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "claims"

    policy_id: Mapped["Uuid"] = mapped_column(
        Uuid, ForeignKey("policies.id"), index=True
    )
    # Public, random reference (CLM-...). Contains no meaning by design.
    claim_reference: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    amount_lovelace: Mapped[int] = mapped_column(BigInteger)
    status: Mapped[ClaimStatus] = mapped_column(
        Enum(ClaimStatus, native_enum=False, length=20),
        default=ClaimStatus.SUBMITTED,
        index=True,
    )
    payout_tx_hash: Mapped[Optional[str]] = mapped_column(
        String(120), nullable=True, unique=True
    )
    decided_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    policy: Mapped[Policy] = relationship(back_populates="claims")
    proof: Mapped[Optional["ZkProofRecord"]] = relationship(back_populates="claim")


class ZkProofRecord(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "zk_proof_records"

    claim_id: Mapped["Uuid"] = mapped_column(
        Uuid, ForeignKey("claims.id"), unique=True
    )
    # Hash of the proof payload only. The proof's inputs (medical data)
    # never reach the server, so they cannot be stored by accident.
    proof_hash: Mapped[str] = mapped_column(String(130))
    verifier: Mapped[str] = mapped_column(String(40), default="mock_midnight")
    is_valid: Mapped[bool] = mapped_column(default=False)
    verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    claim: Mapped[Claim] = relationship(back_populates="proof")
