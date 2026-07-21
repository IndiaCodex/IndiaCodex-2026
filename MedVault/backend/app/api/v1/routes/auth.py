from fastapi import APIRouter, Request, status

from app.core.ratelimit import AUTH_LIMIT, limiter

from app.api.deps import DbSession
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    UserOut,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit(AUTH_LIMIT)
async def register(request: Request, body: RegisterRequest, session: DbSession) -> UserOut:
    user = await AuthService(session).register(body.email, body.password)
    return UserOut.model_validate(user)


@router.post("/login", response_model=TokenPair)
@limiter.limit(AUTH_LIMIT)
async def login(request: Request, body: LoginRequest, session: DbSession) -> TokenPair:
    return await AuthService(session).login(body.email, body.password)


@router.post("/refresh", response_model=TokenPair)
@limiter.limit(AUTH_LIMIT)
async def refresh(request: Request, body: RefreshRequest, session: DbSession) -> TokenPair:
    return await AuthService(session).refresh(body.refresh_token)
