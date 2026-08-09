"""Shared test fixtures.

Every test gets a FRESH in-memory-style SQLite database and a client that
talks to the app in-process. Tests never touch Postgres, never touch the
network, and can run in any order - the three rules of a healthy suite.
"""

import os
import uuid

# Configure the environment BEFORE the app is imported (settings are cached).
os.environ.update(
    ENVIRONMENT="test",
    DEBUG="false",
    LOG_LEVEL="WARNING",
    DATABASE_URL="sqlite+aiosqlite:///./_pytest.db",
    ALLOW_MOCK_CHAIN="true",
    ALLOW_MOCK_WALLET_SIGNATURES="true",
    POOL_WALLET_ADDRESS="addr_test1qpool",
    JWT_SECRET="test-secret",
)

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.db.base import Base
from app.db.session import engine
from app.main import app

TEST_WALLET = "addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer"
ADA = 1_000_000


@pytest_asyncio.fixture(autouse=True)
async def fresh_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c


@pytest_asyncio.fixture
async def user(client):
    """A registered, logged-in user with auth headers ready to use."""
    email = f"user-{uuid.uuid4().hex[:8]}@test.com"
    await client.post(
        "/api/v1/auth/register", json={"email": email, "password": "supersecret1"}
    )
    r = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": "supersecret1"}
    )
    tokens = r.json()
    return {
        "email": email,
        "headers": {"Authorization": f"Bearer {tokens['access_token']}"},
        "tokens": tokens,
    }


@pytest_asyncio.fixture
async def admin(client):
    """A logged-in admin (promoted directly in the DB, like the CLI script)."""
    from sqlalchemy import select

    from app.db.session import SessionFactory
    from app.models.enums import UserRole
    from app.models.user import User

    email = f"admin-{uuid.uuid4().hex[:8]}@test.com"
    await client.post(
        "/api/v1/auth/register", json={"email": email, "password": "supersecret1"}
    )
    async with SessionFactory() as session:
        result = await session.execute(select(User).where(User.email == email))
        result.scalar_one().role = UserRole.ADMIN
        await session.commit()
    r = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": "supersecret1"}
    )
    return {"email": email, "headers": {"Authorization": f"Bearer {r.json()['access_token']}"}}


@pytest_asyncio.fixture
async def active_policy(client, user):
    """A user with linked wallet, seeded plan, and an ACTIVE (premium-paid)
    policy - the starting point for claim and pool tests."""
    from app.db.session import SessionFactory
    from app.repositories.insurance_repo import PlanRepository

    async with SessionFactory() as session:
        await PlanRepository(session).create(
            name="Essential",
            description="test plan",
            coverage_lovelace=25_000 * ADA,
            premium_lovelace=45 * ADA,
            period_days=30,
            max_claims_per_year=2,
        )
        await session.commit()

    h = user["headers"]
    await client.post("/api/v1/wallets/challenge", json={"address": TEST_WALLET}, headers=h)
    await client.post(
        "/api/v1/wallets/verify",
        json={"address": TEST_WALLET, "signature": f"mock:{TEST_WALLET}", "key": ""},
        headers=h,
    )
    plans = (await client.get("/api/v1/plans")).json()
    policy = (
        await client.post("/api/v1/policies", json={"plan_id": plans[0]["id"]}, headers=h)
    ).json()
    await client.post(
        "/api/v1/premiums/deposit",
        json={"policy_id": policy["id"], "tx_hash": f"mocktx:{TEST_WALLET}:{45 * ADA}"},
        headers=h,
    )
    policy = (await client.get("/api/v1/policies/me", headers=h)).json()[0]
    return {**user, "policy": policy}
