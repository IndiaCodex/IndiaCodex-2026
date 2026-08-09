import enum


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class PolicyStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    LAPSED = "lapsed"
    CANCELLED = "cancelled"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    FAILED = "failed"


class ClaimStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    PROOF_VERIFIED = "proof_verified"
    APPROVED = "approved"
    PAID = "paid"
    REJECTED = "rejected"


class AllocationStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    WITHDRAWN = "withdrawn"


class TransactionType(str, enum.Enum):
    PREMIUM = "premium"
    PAYOUT = "payout"
    ALLOCATION = "allocation"
    DEALLOCATION = "deallocation"
    YIELD = "yield"


class TransactionDirection(str, enum.Enum):
    IN = "in"
    OUT = "out"
