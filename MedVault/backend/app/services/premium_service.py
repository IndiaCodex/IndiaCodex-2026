import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.blockchain.ports import CardanoChainPort
from app.core.config import get_settings
from app.core.exceptions import AppError, ConflictError, NotFoundError
from app.core.logging import get_logger
from app.models.enums import PolicyStatus
from app.models.insurance import PremiumPayment
from app.repositories.insurance_repo import PlanRepository, PolicyRepository
from app.repositories.premium_repo import PremiumRepository
from app.repositories.wallet_repo import WalletRepository

logger = get_logger(__name__)


class DepositVerificationError(AppError):
    status_code = 400
    code = "deposit_verification_failed"


class PremiumService:
    def __init__(self, session: AsyncSession, chain: CardanoChainPort) -> None:
        self._session = session
        self._policies = PolicyRepository(session)
        self._plans = PlanRepository(session)
        self._premiums = PremiumRepository(session)
        self._wallets = WalletRepository(session)
        self._chain = chain

    async def submit_deposit(
        self, user_id: uuid.UUID, policy_id: uuid.UUID, tx_hash: str
    ) -> PremiumPayment:
        settings = get_settings()

        policies = await self._policies.list_for_user(user_id)
        policy = next((p for p in policies if p.id == policy_id), None)
        if policy is None:
            raise NotFoundError("Policy not found.")
        if policy.status not in (PolicyStatus.PENDING, PolicyStatus.ACTIVE):
            raise DepositVerificationError("This policy cannot accept premiums.")

        plan = await self._plans.get(policy.plan_id)

        # Replay protection, layer 1 (the DB unique constraint is layer 2).
        if await self._premiums.get_by_tx_hash(tx_hash) is not None:
            raise ConflictError("This transaction has already been credited.")

        tx = await self._chain.get_transaction(tx_hash)
        if not tx.exists:
            raise DepositVerificationError("Transaction not found on-chain.")
        if tx.confirmations < settings.min_tx_confirmations:
            raise DepositVerificationError(
                f"Transaction needs {settings.min_tx_confirmations} confirmation(s); "
                f"has {tx.confirmations}. Try again shortly."
            )

        paid = tx.paid_to(settings.pool_wallet_address)
        if paid < plan.premium_lovelace:
            raise DepositVerificationError(
                f"Deposit pays {paid} lovelace to the pool; "
                f"premium requires {plan.premium_lovelace}."
            )

        # The deposit must come from a wallet this user has PROVEN they own -
        # otherwise anyone could claim someone else's deposit.
        user_wallets = {
            w.address for w in await self._wallets.list_for_user(user_id) if w.is_verified
        }
        if not user_wallets.intersection(tx.input_addresses):
            raise DepositVerificationError(
                "Deposit does not originate from any of your verified wallets."
            )

        payment = await self._premiums.create_confirmed(
            policy.id, paid, tx_hash
        )
        await self._premiums.record_transaction(user_id, paid, tx_hash)

        # First confirmed premium activates the policy.
        now = datetime.now(timezone.utc)
        if policy.status == PolicyStatus.PENDING:
            policy.status = PolicyStatus.ACTIVE
            policy.start_date = now
        policy.next_premium_due = now + timedelta(days=plan.period_days)
        await self._session.flush()

        logger.info(
            "premium_confirmed",
            policy_id=str(policy.id),
            amount_lovelace=paid,
        )
        return payment

    async def my_premiums(self, user_id: uuid.UUID) -> list[PremiumPayment]:
        return await self._premiums.list_for_user(user_id)
