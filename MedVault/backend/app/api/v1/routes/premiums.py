from fastapi import APIRouter, status

from app.api.deps import Chain, CurrentUser, DbSession
from app.schemas.premium import DepositRequest, PremiumOut
from app.services.premium_service import PremiumService

router = APIRouter(prefix="/premiums", tags=["premiums"])


@router.post("/deposit", response_model=PremiumOut, status_code=status.HTTP_201_CREATED)
async def submit_deposit(
    body: DepositRequest, user: CurrentUser, session: DbSession, chain: Chain
) -> PremiumOut:
    payment = await PremiumService(session, chain).submit_deposit(
        user.id, body.policy_id, body.tx_hash
    )
    return PremiumOut.model_validate(payment)


@router.get("/me", response_model=list[PremiumOut])
async def my_premiums(
    user: CurrentUser, session: DbSession, chain: Chain
) -> list[PremiumOut]:
    premiums = await PremiumService(session, chain).my_premiums(user.id)
    return [PremiumOut.model_validate(p) for p in premiums]
