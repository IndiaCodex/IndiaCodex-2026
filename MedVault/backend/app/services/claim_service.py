import secrets
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.blockchain.ports import ZKProofVerifierPort
from app.core.exceptions import AppError, ForbiddenError, NotFoundError
from app.core.logging import get_logger
from app.models.enums import (
    ClaimStatus,
    PaymentStatus,
    PolicyStatus,
    TransactionDirection,
    TransactionType,
)
from app.models.insurance import Claim, Policy
from app.models.ledger import AuditLog, Transaction
from app.repositories.claim_repo import ClaimRepository
from app.repositories.insurance_repo import PlanRepository, PolicyRepository
from app.services.pool_service import PoolService

logger = get_logger(__name__)


class ClaimValidationError(AppError):
    status_code = 400
    code = "claim_validation_failed"


class InvalidProofError(AppError):
    status_code = 422
    code = "zk_proof_invalid"


class ClaimService:
    def __init__(self, session: AsyncSession, verifier: ZKProofVerifierPort) -> None:
        self._session = session
        self._claims = ClaimRepository(session)
        self._policies = PolicyRepository(session)
        self._plans = PlanRepository(session)
        self._verifier = verifier

    async def submit(
        self,
        user_id: uuid.UUID,
        policy_id: uuid.UUID,
        amount_lovelace: int,
        proof_payload: dict,
    ) -> Claim:
        policies = await self._policies.list_for_user(user_id)
        policy = next((p for p in policies if p.id == policy_id), None)
        if policy is None:
            raise NotFoundError("Policy not found.")
        if policy.status != PolicyStatus.ACTIVE:
            raise ClaimValidationError("Only active policies can submit claims.")

        plan = await self._plans.get(policy.plan_id)
        if amount_lovelace > plan.coverage_lovelace:
            raise ClaimValidationError("Claim exceeds plan coverage.")
        if await self._claims.count_this_year(policy.id) >= plan.max_claims_per_year:
            raise ClaimValidationError("Yearly claim limit reached for this policy.")

        # The privacy moment: verify eligibility without seeing anything.
        result = self._verifier.verify_claim_proof(
            proof_payload, policy.commitment_hash
        )
        if not result.is_valid:
            raise InvalidProofError("Zero-knowledge proof verification failed.")

        reference = await self._unique_reference()
        claim = await self._claims.create(policy.id, reference, amount_lovelace)
        await self._claims.store_proof(
            claim.id, result.proof_hash, result.verifier, result.is_valid
        )
        logger.info("claim_submitted", reference=reference)
        return claim

    async def my_claims(self, user_id: uuid.UUID) -> list[Claim]:
        return await self._claims.list_for_user(user_id)

    # ---- admin operations ----

    async def list_all(self, status: ClaimStatus | None) -> list[Claim]:
        return await self._claims.list_all(status)

    async def approve(self, admin_id: uuid.UUID, claim_id: uuid.UUID) -> Claim:
        claim = await self._claims.get(claim_id)
        if claim is None:
            raise NotFoundError("Claim not found.")
        if claim.status != ClaimStatus.PROOF_VERIFIED:
            raise ForbiddenError("Only proof-verified claims can be approved.")
        claim.status = ClaimStatus.APPROVED
        claim.decided_at = datetime.now(timezone.utc)
        self._session.add(
            AuditLog(actor_id=admin_id, action="APPROVE_CLAIM",
                     entity="claim", entity_id=claim.claim_reference)
        )
        await self._session.flush()
        return claim

    async def reject(self, admin_id: uuid.UUID, claim_id: uuid.UUID) -> Claim:
        claim = await self._claims.get(claim_id)
        if claim is None:
            raise NotFoundError("Claim not found.")
        if claim.status in (ClaimStatus.PAID, ClaimStatus.REJECTED):
            raise ForbiddenError("Claim already finalized.")
        claim.status = ClaimStatus.REJECTED
        claim.decided_at = datetime.now(timezone.utc)
        self._session.add(
            AuditLog(actor_id=admin_id, action="REJECT_CLAIM",
                     entity="claim", entity_id=claim.claim_reference)
        )
        await self._session.flush()
        return claim

    async def payout(self, admin_id: uuid.UUID, claim_id: uuid.UUID) -> Claim:
        claim = await self._claims.get(claim_id)
        if claim is None:
            raise NotFoundError("Claim not found.")
        if claim.status != ClaimStatus.APPROVED:
            raise ForbiddenError("Only approved claims can be paid.")

        # Module 8 invariant: payouts come from liquid funds only.
        await PoolService(self._session).require_liquidity(claim.amount_lovelace)

        # Hackathon: simulated payout tx. Production: build+submit a real
        # transaction from the pool wallet (and Module 8 adds the liquidity
        # check before any payout).
        payout_tx = f"payout_{secrets.token_hex(16)}"
        claim.status = ClaimStatus.PAID
        claim.payout_tx_hash = payout_tx

        policy = await self._session.get(Policy, claim.policy_id)
        self._session.add(
            Transaction(
                user_id=policy.user_id,
                type=TransactionType.PAYOUT,
                direction=TransactionDirection.OUT,
                amount_lovelace=claim.amount_lovelace,
                tx_hash=payout_tx,
                status=PaymentStatus.CONFIRMED,
            )
        )
        self._session.add(
            AuditLog(actor_id=admin_id, action="PAYOUT_CLAIM",
                     entity="claim", entity_id=claim.claim_reference)
        )
        await self._session.flush()
        logger.info("claim_paid", reference=claim.claim_reference)
        return claim

    async def _unique_reference(self) -> str:
        year = datetime.now(timezone.utc).year
        while True:
            ref = f"CLM-{year}-{secrets.randbelow(10000):04d}"
            if not await self._claims.reference_exists(ref):
                return ref
