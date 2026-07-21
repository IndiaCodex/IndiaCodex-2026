from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1.router import api_router
from app.core.ratelimit import limiter
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging, get_logger


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Runs once at startup and once at shutdown."""
    logger = get_logger(__name__)
    settings = get_settings()
    logger.info("startup", app=settings.app_name, environment=settings.environment)
    yield
    logger.info("shutdown")


def create_app() -> FastAPI:
    """Application factory: builds and wires the FastAPI app.

    A factory (instead of a module-level app with side effects) means tests
    can create fresh, isolated app instances with different settings.
    """
    configure_logging()
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        lifespan=lifespan,
        # Interactive docs are a debugging gift in dev and an attack-surface
        # liability in production - so they are dev-only.
        docs_url="/docs" if not settings.is_production else None,
        redoc_url=None,
        openapi_url="/openapi.json" if not settings.is_production else None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)

    @app.exception_handler(RateLimitExceeded)
    async def handle_rate_limit(request, exc):
        from fastapi.responses import JSONResponse

        return JSONResponse(
            status_code=429,
            content={"error": {"code": "rate_limited",
                               "message": "Too many requests. Slow down."}},
        )

    register_exception_handlers(app)
    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
