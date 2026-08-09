from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import get_settings

router = APIRouter(tags=["meta"])


class HealthResponse(BaseModel):
    status: str
    app: str
    environment: str


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Liveness probe: proves the process is up and serving requests.

    Monitors and deployment platforms poll this. Later we can add a
    /readiness variant that also checks the database connection.
    """
    settings = get_settings()
    return HealthResponse(
        status="ok",
        app=settings.app_name,
        environment=settings.environment,
    )
