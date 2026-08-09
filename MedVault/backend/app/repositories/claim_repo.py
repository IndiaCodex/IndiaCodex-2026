import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ClaimStatus
from app.models.insurance import Claim, Policy, ZkProofRecord


class ClaimRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, claim_id: uuid.UUID) -> Optional[Claim]:
        return await self._session.get(Claim, claim_id)

    async def list_for_user(self, user_id: uuid.UUID) -> list[Claim]:
        result = await self._session.execute(
            select(Claim)
            .join(Policy)
            .where(Policy.user_id == user_id)
            .order_by(Claim.created_at.desc())
        )
        return list(result.scalars())

    async def list_all(self, status: Optional[ClaimStatus] = None) -> list[Claim]:
        query = select(Claim).order_by(Claim.created_at.desc())
        if status is not None:
            query = query.where(Claim.status == status)
        result = await self._session.execute(query)
        return list(result.scalars())

    async def count_this_year(self, policy_id: uuid.UUID) -> int:
        year = datetime.now(timezone.utc).year
        result = await self._session.execute(
            select(func.count(Claim.id)).where(
                Claim.policy_id == policy_id,
                Claim.status != ClaimStatus.REJECTED,
                extract("year", Claim.created_at) == year,
            )
        )
        return int(result.scalar_one())

    async def reference_exists(self, reference: str) -> bool:
        result = await self._session.execute(
            select(Claim.id).where(Claim.claim_reference == reference)
        )
        return result.scalar_one_or_none() is not None

    async def create(
        self, policy_id: uuid.UUID, reference: str, amount_lovelace: int
    ) -> Claim:
        claim = Claim(
            policy_id=policy_id,
            claim_reference=reference,
            amount_lovelace=amount_lovelace,
            status=ClaimStatus.PROOF_VERIFIED,
        )
        self._session.add(claim)
        await self._session.flush()
        return claim

    async def store_proof(
        self, claim_id: uuid.UUID, proof_hash: str, verifier: str, is_valid: bool
    ) -> ZkProofRecord:
        record = ZkProofRecord(
            claim_id=claim_id,
            proof_hash=proof_hash,
            verifier=verifier,
            is_valid=is_valid,
            verified_at=datetime.now(timezone.utc),
        )
        self._session.add(record)
        await self._session.flush()
        return record
