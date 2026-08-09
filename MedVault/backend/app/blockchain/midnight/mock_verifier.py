import hashlib
import json

from app.blockchain.ports import ProofResult, ZKProofVerifierPort
from app.core.logging import get_logger

logger = get_logger(__name__)


class MockMidnightVerifier(ZKProofVerifierPort):
    """Simulates ZK verification with the same inputs/outputs as the real thing.

    A 'proof' here is any JSON object containing the policy's commitment
    hash - standing in for 'I can open this commitment'. We store only
    a SHA-256 of the payload; the payload itself is discarded.
    """

    def verify_claim_proof(
        self, proof_payload: dict, expected_commitment: str
    ) -> ProofResult:
        canonical = json.dumps(proof_payload, sort_keys=True)
        proof_hash = "0x" + hashlib.sha256(canonical.encode()).hexdigest()
        is_valid = proof_payload.get("commitment") == expected_commitment
        if not is_valid:
            logger.warning("zk_proof_invalid", proof_hash=proof_hash[:18])
        return ProofResult(
            is_valid=is_valid, proof_hash=proof_hash, verifier="mock_midnight"
        )
