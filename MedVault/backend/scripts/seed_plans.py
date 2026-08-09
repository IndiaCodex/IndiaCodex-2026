"""Seed the three default insurance plans. Run: python -m scripts.seed_plans"""

import asyncio

from app.db.session import SessionFactory
from app.repositories.insurance_repo import PlanRepository

ADA = 1_000_000

PLANS = [
    dict(
        name="Essential",
        description="Core private coverage",
        coverage_lovelace=25_000 * ADA,
        premium_lovelace=45 * ADA,
        period_days=30,
        max_claims_per_year=12,
    ),
    dict(
        name="Shield Plus",
        description="Extended coverage + yield boost",
        coverage_lovelace=100_000 * ADA,
        premium_lovelace=120 * ADA,
        period_days=30,
        max_claims_per_year=24,
    ),
    dict(
        name="Sovereign",
        description="Maximum private protection",
        coverage_lovelace=500_000 * ADA,
        premium_lovelace=380 * ADA,
        period_days=30,
        max_claims_per_year=48,
    ),
]


async def main() -> None:
    async with SessionFactory() as session:
        repo = PlanRepository(session)
        for plan in PLANS:
            if await repo.get_by_name(plan["name"]) is None:
                await repo.create(**plan)
                print(f"created plan: {plan['name']}")
            else:
                print(f"exists, skipping: {plan['name']}")
        await session.commit()


if __name__ == "__main__":
    asyncio.run(main())
