from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession, SignatureVerifier
from app.schemas.wallet import (
    ChallengeRequest,
    ChallengeResponse,
    VerifyRequest,
    WalletOut,
)
from app.services.wallet_service import WalletService

router = APIRouter(prefix="/wallets", tags=["wallets"])


@router.post("/challenge", response_model=ChallengeResponse)
async def create_challenge(
    body: ChallengeRequest,
    user: CurrentUser,
    session: DbSession,
    verifier: SignatureVerifier,
) -> ChallengeResponse:
    nonce, expires_at = await WalletService(session, verifier).create_challenge(
        user.id, body.address
    )
    return ChallengeResponse(nonce=nonce, expires_at=expires_at)


@router.post("/verify", response_model=WalletOut, status_code=status.HTTP_201_CREATED)
async def verify_wallet(
    body: VerifyRequest,
    user: CurrentUser,
    session: DbSession,
    verifier: SignatureVerifier,
) -> WalletOut:
    wallet = await WalletService(session, verifier).verify_and_link(
        user.id, body.address, body.signature, body.key
    )
    return WalletOut.model_validate(wallet)


@router.get("", response_model=list[WalletOut])
async def list_wallets(
    user: CurrentUser, session: DbSession, verifier: SignatureVerifier
) -> list[WalletOut]:
    wallets = await WalletService(session, verifier).list_wallets(user.id)
    return [WalletOut.model_validate(w) for w in wallets]
