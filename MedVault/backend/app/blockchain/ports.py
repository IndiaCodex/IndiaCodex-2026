from abc import ABC, abstractmethod


class SignatureVerifierPort(ABC):
    """Port (interface) for verifying wallet-signed messages.

    Services depend on this abstraction, never on a concrete library.
    Swapping real crypto for a dev mock - or pycardano for something
    else - changes one wiring line, not business logic.
    """

    @abstractmethod
    def verify(self, address: str, signature: str, key: str, expected_message: str) -> bool:
        """True if `signature` is a valid signature of `expected_message`
        made by the owner of `address`."""


class PrivateVaultPort(ABC):
    """Port for the Midnight private vault.

    Production design: a Compact smart contract on Midnight holding
    shielded policy state; commitments registered on-chain.
    Hackathon implementation: MockMidnightVault computes the same
    commitments locally. Same interface, honest swap later.
    """

    @abstractmethod
    def register_policy_commitment(self, user_id: str, plan_id: str) -> str:
        """Registers a private policy commitment; returns the commitment hash."""


from dataclasses import dataclass, field


@dataclass
class ChainTx:
    """What we need to know about an on-chain transaction to verify a deposit."""

    exists: bool
    confirmations: int = 0
    # (address, lovelace) for every output of the transaction
    outputs: list[tuple[str, int]] = field(default_factory=list)
    # every address that funded the transaction (its inputs)
    input_addresses: list[str] = field(default_factory=list)

    def paid_to(self, address: str) -> int:
        return sum(amount for addr, amount in self.outputs if addr == address)


class CardanoChainPort(ABC):
    """Port for reading the Cardano blockchain."""

    @abstractmethod
    async def get_transaction(self, tx_hash: str) -> ChainTx: ...


@dataclass
class ProofResult:
    is_valid: bool
    proof_hash: str
    verifier: str


class ZKProofVerifierPort(ABC):
    """Port for zero-knowledge claim-eligibility verification.

    Production: the proof is generated client-side and verified by a
    Midnight circuit on-chain. Hackathon: MockMidnightVerifier checks the
    payload against the policy commitment. The server NEVER receives
    medical data in either case - only a proof and a verdict.
    """

    @abstractmethod
    def verify_claim_proof(
        self, proof_payload: dict, expected_commitment: str
    ) -> ProofResult: ...
