from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession, PrivateVault
from app.schemas.insurance import EnrollRequest, PolicyOut
from app.services.policy_service import PolicyService

router = APIRouter(prefix="/policies", tags=["policies"])


@router.post("", response_model=PolicyOut, status_code=status.HTTP_201_CREATED)
async def enroll(
    body: EnrollRequest, user: CurrentUser, session: DbSession, vault: PrivateVault
) -> PolicyOut:
    policy = await PolicyService(session, vault).enroll(user.id, body.plan_id)
    return PolicyOut.model_validate(policy)


@router.get("/me", response_model=list[PolicyOut])
async def my_policies(
    user: CurrentUser, session: DbSession, vault: PrivateVault
) -> list[PolicyOut]:
    policies = await PolicyService(session, vault).my_policies(user.id)
    return [PolicyOut.model_validate(p) for p in policies]
