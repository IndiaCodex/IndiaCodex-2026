from fastapi import APIRouter, status

from app.api.deps import AdminUser, DbSession
from app.schemas.insurance import PlanCreate, PlanOut
from app.services.policy_service import PolicyService
from app.api.deps import PrivateVault

router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("", response_model=list[PlanOut])
async def list_plans(session: DbSession, vault: PrivateVault) -> list[PlanOut]:
    plans = await PolicyService(session, vault).list_plans()
    return [PlanOut.model_validate(p) for p in plans]


@router.post("", response_model=PlanOut, status_code=status.HTTP_201_CREATED)
async def create_plan(
    body: PlanCreate, admin: AdminUser, session: DbSession, vault: PrivateVault
) -> PlanOut:
    plan = await PolicyService(session, vault).create_plan(**body.model_dump())
    return PlanOut.model_validate(plan)
