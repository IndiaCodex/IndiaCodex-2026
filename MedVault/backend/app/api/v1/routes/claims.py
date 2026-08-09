import uuid
from typing import Optional

from fastapi import APIRouter, status

from app.api.deps import AdminUser, CurrentUser, DbSession, ZkVerifier
from app.models.enums import ClaimStatus
from app.schemas.claim import ClaimOut, ClaimSubmit
from app.services.claim_service import ClaimService

router = APIRouter(prefix="/claims", tags=["claims"])


@router.post("", response_model=ClaimOut, status_code=status.HTTP_201_CREATED)
async def submit_claim(
    body: ClaimSubmit, user: CurrentUser, session: DbSession, verifier: ZkVerifier
) -> ClaimOut:
    claim = await ClaimService(session, verifier).submit(
        user.id, body.policy_id, body.amount_lovelace, body.proof_payload
    )
    return ClaimOut.model_validate(claim)


@router.get("/me", response_model=list[ClaimOut])
async def my_claims(
    user: CurrentUser, session: DbSession, verifier: ZkVerifier
) -> list[ClaimOut]:
    claims = await ClaimService(session, verifier).my_claims(user.id)
    return [ClaimOut.model_validate(c) for c in claims]


@router.get("", response_model=list[ClaimOut])
async def list_claims(
    admin: AdminUser,
    session: DbSession,
    verifier: ZkVerifier,
    status_filter: Optional[ClaimStatus] = None,
) -> list[ClaimOut]:
    claims = await ClaimService(session, verifier).list_all(status_filter)
    return [ClaimOut.model_validate(c) for c in claims]


@router.post("/{claim_id}/approve", response_model=ClaimOut)
async def approve_claim(
    claim_id: uuid.UUID, admin: AdminUser, session: DbSession, verifier: ZkVerifier
) -> ClaimOut:
    claim = await ClaimService(session, verifier).approve(admin.id, claim_id)
    return ClaimOut.model_validate(claim)


@router.post("/{claim_id}/reject", response_model=ClaimOut)
async def reject_claim(
    claim_id: uuid.UUID, admin: AdminUser, session: DbSession, verifier: ZkVerifier
) -> ClaimOut:
    claim = await ClaimService(session, verifier).reject(admin.id, claim_id)
    return ClaimOut.model_validate(claim)


@router.post("/{claim_id}/payout", response_model=ClaimOut)
async def payout_claim(
    claim_id: uuid.UUID, admin: AdminUser, session: DbSession, verifier: ZkVerifier
) -> ClaimOut:
    claim = await ClaimService(session, verifier).payout(admin.id, claim_id)
    return ClaimOut.model_validate(claim)
