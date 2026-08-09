import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.blockchain.ports import PrivateVaultPort
from app.core.exceptions import ConflictError, NotFoundError
from app.core.logging import get_logger
from app.models.insurance import InsurancePlan, Policy
from app.repositories.insurance_repo import PlanRepository, PolicyRepository

logger = get_logger(__name__)


class PolicyService:
    def __init__(self, session: AsyncSession, vault: PrivateVaultPort) -> None:
        self._plans = PlanRepository(session)
        self._policies = PolicyRepository(session)
        self._vault = vault

    async def list_plans(self) -> list[InsurancePlan]:
        return await self._plans.list_active()

    async def create_plan(self, **kwargs) -> InsurancePlan:
        if await self._plans.get_by_name(kwargs["name"]) is not None:
            raise ConflictError("A plan with this name already exists.")
        return await self._plans.create(**kwargs)

    async def enroll(self, user_id: uuid.UUID, plan_id: uuid.UUID) -> Policy:
        plan = await self._plans.get(plan_id)
        if plan is None or not plan.is_active:
            raise NotFoundError("Plan not found.")
        if await self._policies.get_open_for_plan(user_id, plan_id) is not None:
            raise ConflictError("You already have an open policy for this plan.")
        # The privacy step: register a shielded commitment. The policy row
        # stores only the resulting hash - nothing linking it to health data.
        commitment = self._vault.register_policy_commitment(str(user_id), str(plan_id))
        policy = await self._policies.create(user_id, plan_id, commitment)
        logger.info("policy_enrolled", policy_id=str(policy.id))
        return policy

    async def my_policies(self, user_id: uuid.UUID) -> list[Policy]:
        return await self._policies.list_for_user(user_id)
