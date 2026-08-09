"""Simulate a yield epoch: credit interest from active strategies to the pool.

Run: python -m scripts.distribute_yield [apy_percent]
Hackathon stand-in for real DeFi strategy returns.
"""

import asyncio
import sys

from app.db.session import SessionFactory
from app.repositories.pool_repo import PoolRepository
from app.services.pool_service import PoolService


async def main(apy_percent: float) -> None:
    async with SessionFactory() as session:
        pool = PoolRepository(session)
        allocated = await pool.allocated_active()
        if allocated == 0:
            print("No active allocations - nothing to accrue.")
            return
        # One month of yield at the given APY on deployed funds
        earned = int(allocated * (apy_percent / 100) / 12)
        await PoolService(session).distribute_yield(earned)
        await session.commit()
        print(f"Distributed {earned} lovelace ({earned / 1_000_000:.2f} ADA) "
              f"of yield on {allocated / 1_000_000:.0f} ADA deployed.")


if __name__ == "__main__":
    apy = float(sys.argv[1]) if len(sys.argv) > 1 else 9.4
    asyncio.run(main(apy))
