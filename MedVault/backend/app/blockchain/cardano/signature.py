from pycardano.cip.cip8 import verify as cip8_verify

from app.blockchain.ports import SignatureVerifierPort
from app.core.logging import get_logger

logger = get_logger(__name__)


class Cip8SignatureVerifier(SignatureVerifierPort):
    """Real CIP-8 (COSE_Sign1) verification via PyCardano.

    This is exactly what browser wallets (Lace, Eternl, Nami) produce
    from the CIP-30 `signData` call.
    """

    def verify(self, address: str, signature: str, key: str, expected_message: str) -> bool:
        try:
            result = cip8_verify({"signature": signature, "key": key})
        except Exception:
            logger.warning("cip8_malformed_signature", address=address)
            return False
        if not result.get("verified", False):
            return False
        if result.get("message") != expected_message:
            # Valid signature over the WRONG text is still a failure -
            # otherwise any old signed message could be replayed here.
            return False
        signer = result.get("signing_address")
        return signer is not None and str(signer) == address
