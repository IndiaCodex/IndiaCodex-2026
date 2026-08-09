"""Import all models so Base.metadata knows every table (Alembic needs this)."""

from app.models.auth import RefreshToken
from app.models.insurance import (
    Claim,
    InsurancePlan,
    Policy,
    PremiumPayment,
    ZkProofRecord,
)
from app.models.ledger import AuditLog, Transaction
from app.models.pool import PoolSnapshot, YieldAllocation
from app.models.user import User, Wallet
from app.models.wallet_challenge import WalletChallenge

__all__ = [
    "RefreshToken",
    "AuditLog",
    "Claim",
    "InsurancePlan",
    "Policy",
    "PoolSnapshot",
    "PremiumPayment",
    "Transaction",
    "User",
    "Wallet",
    "WalletChallenge",
    "YieldAllocation",
    "ZkProofRecord",
]
