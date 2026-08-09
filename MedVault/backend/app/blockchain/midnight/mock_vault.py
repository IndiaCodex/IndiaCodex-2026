import hashlib
import secrets

from app.blockchain.ports import PrivateVaultPort
from app.core.logging import get_logger

logger = get_logger(__name__)


class MockMidnightVault(PrivateVaultPort):
    """Simulates Midnight's shielded vault with real commitment math.

    commitment = SHA-256(user_id || plan_id || random_salt)

    The random salt makes the commitment unlinkable: knowing a user id
    and plan id is NOT enough to recompute it. Even our own database
    cannot prove which user a commitment belongs to without the salt -
    which we deliberately do not store.
    """

    def register_policy_commitment(self, user_id: str, plan_id: str) -> str:
        salt = secrets.token_hex(32)
        commitment = hashlib.sha256(f"{user_id}|{plan_id}|{salt}".encode()).hexdigest()
        logger.info("commitment_registered", commitment=f"0x{commitment[:16]}...")
        return f"0x{commitment}"
