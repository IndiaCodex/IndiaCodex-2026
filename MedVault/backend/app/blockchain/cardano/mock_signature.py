from app.blockchain.ports import SignatureVerifierPort


class MockSignatureVerifier(SignatureVerifierPort):
    """Development-only verifier so the flow can be exercised from /docs
    without a browser wallet. Accepts 'mock:<address>' as the signature.

    Wiring (deps.py) refuses to use this class in production.
    """

    def verify(self, address: str, signature: str, key: str, expected_message: str) -> bool:
        return signature == f"mock:{address}"
