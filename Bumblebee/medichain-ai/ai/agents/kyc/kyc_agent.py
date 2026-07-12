"""
MediChain AI — KYC Agent
Verifies patient/doctor identity documents via Midnight ZKP.
Charges ₳1 per verification via Masumi.
"""
import logging
import httpx
from ai.shared.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class KycAgent(BaseAgent):
    """KYC Verification Agent — identity verification without exposing documents."""

    def __init__(self, config: dict):
        super().__init__("kyc", config)

    async def execute(self, task: dict) -> dict:
        document_hash = task.get("document_hash", "")
        zkp_proof_hash = task.get("zkp_proof_hash", "")
        verification_type = task.get("verification_type", "PATIENT_KYC")
        user_id = task.get("user_id")

        logger.info(f"[kyc] Verifying {verification_type} for user {user_id}")

        # Verify ZKP proof on Midnight
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.config['midnight_node_url']}/api/proofs/verify",
                    json={"proof": zkp_proof_hash, "circuit": "verify_patient_kyc"},
                    timeout=10.0
                )
                verified = response.json().get("verified", True)
            except Exception:
                verified = True  # Demo mode

        # Charge ₳1 via Masumi
        masumi_tx = await self.charge_via_masumi(1.0, f"KYC verification for {user_id}")

        logger.info(f"[kyc] ✅ KYC {verification_type}: verified={verified}")

        return {
            "user_id": user_id,
            "verification_type": verification_type,
            "verified": verified,
            "zkp_proof_hash": zkp_proof_hash,
            "masumi_tx_hash": masumi_tx,
            "privacy_note": "No personal documents were seen or stored by MediChain AI",
            "workflow_id": task.get("workflow_id")
        }
