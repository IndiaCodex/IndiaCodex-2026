import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import PolicyStatus
from app.models.insurance import InsurancePlan, Policy


class PlanRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_active(self) -> list[InsurancePlan]:
        result = await self._session.execute(
            select(InsurancePlan)
            .where(InsurancePlan.is_active.is_(True))
            .order_by(InsurancePlan.premium_lovelace)
        )
        return list(result.scalars())

    async def get(self, plan_id: uuid.UUID) -> Optional[InsurancePlan]:
        return await self._session.get(InsurancePlan, plan_id)

    async def get_by_name(self, name: str) -> Optional[InsurancePlan]:
        result = await self._session.execute(
            select(InsurancePlan).where(InsurancePlan.name == name)
        )
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> InsurancePlan:
        plan = InsurancePlan(**kwargs)
        self._session.add(plan)
        await self._session.flush()
        return plan


class PolicyRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_for_user(self, user_id: uuid.UUID) -> list[Policy]:
        result = await self._session.execute(
            select(Policy).where(Policy.user_id == user_id).order_by(Policy.created_at)
        )
        return list(result.scalars())

    async def get_open_for_plan(
        self, user_id: uuid.UUID, plan_id: uuid.UUID
    ) -> Optional[Policy]:
        result = await self._session.execute(
            select(Policy).where(
                Policy.user_id == user_id,
                Policy.plan_id == plan_id,
                Policy.status.in_([PolicyStatus.PENDING, PolicyStatus.ACTIVE]),
            )
        )
        return result.scalars().first()

    async def create(
        self, user_id: uuid.UUID, plan_id: uuid.UUID, commitment_hash: str
    ) -> Policy:
        policy = Policy(
            user_id=user_id, plan_id=plan_id, commitment_hash=commitment_hash
        )
        self._session.add(policy)
        await self._session.flush()
        return policy
