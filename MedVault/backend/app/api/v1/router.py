from fastapi import APIRouter

from app.api.v1.routes import (
    auth,
    claims,
    health,
    plans,
    policies,
    pool,
    premiums,
    transactions,
    users,
    wallets,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(wallets.router)
api_router.include_router(plans.router)
api_router.include_router(policies.router)
api_router.include_router(premiums.router)
api_router.include_router(claims.router)
api_router.include_router(pool.router)
api_router.include_router(transactions.router)
