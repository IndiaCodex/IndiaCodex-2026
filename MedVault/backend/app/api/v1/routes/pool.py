import uuid

from fastapi import APIRouter, status

from app.api.deps import AdminUser, DbSession
from app.schemas.pool import AllocationCreate, AllocationOut, PoolStatus
from app.services.pool_service import PoolService

router = APIRouter(prefix="/pool", tags=["pool"])


@router.get("/status", response_model=PoolStatus)
async def pool_status(session: DbSession) -> PoolStatus:
    """Public transparency endpoint: aggregate totals only - individual
    positions and identities stay private."""
    return await PoolService(session).status()


@router.get("/allocations", response_model=list[AllocationOut])
async def list_allocations(admin: AdminUser, session: DbSession) -> list[AllocationOut]:
    allocations = await PoolService(session).list_allocations()
    return [AllocationOut.model_validate(a) for a in allocations]


@router.post("/allocations", response_model=AllocationOut, status_code=status.HTTP_201_CREATED)
async def allocate(
    body: AllocationCreate, admin: AdminUser, session: DbSession
) -> AllocationOut:
    allocation = await PoolService(session).allocate(
        admin.id, body.strategy, body.amount_lovelace
    )
    return AllocationOut.model_validate(allocation)


@router.post("/allocations/{allocation_id}/withdraw", response_model=AllocationOut)
async def withdraw(
    allocation_id: uuid.UUID, admin: AdminUser, session: DbSession
) -> AllocationOut:
    allocation = await PoolService(session).withdraw(admin.id, allocation_id)
    return AllocationOut.model_validate(allocation)
