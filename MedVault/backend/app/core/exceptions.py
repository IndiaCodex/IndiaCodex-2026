from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logging import get_logger

logger = get_logger(__name__)


class AppError(Exception):
    """Base class for all expected application errors.

    Services raise these; the handlers below turn them into clean HTTP
    responses. Routes never build error JSON by hand - one format, everywhere:

        {"error": {"code": "...", "message": "..."}}
    """

    status_code: int = status.HTTP_400_BAD_REQUEST
    code: str = "bad_request"

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "not_found"


class UnauthorizedError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "unauthorized"


class ForbiddenError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    code = "forbidden"


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT
    code = "conflict"


def _error_body(code: str, message: str) -> dict:
    return {"error": {"code": code, "message": message}}


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_body(exc.code, exc.message),
        )

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_error(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        # Keep framework errors (404, 405, ...) in our standard shape too.
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_body("http_error", str(exc.detail)),
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "validation_error",
                    "message": "Request validation failed.",
                    "details": exc.errors(),
                }
            },
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        # Log the full details for us; send a generic message to the client.
        # Never leak stack traces or internals - they help attackers.
        logger.exception("unhandled_error", path=str(request.url.path))
        # 500s from this handler bypass CORSMiddleware (Starlette quirk), so
        # browsers would mask real errors as network failures. Add the header
        # ourselves for allowed origins.
        from app.core.config import get_settings

        headers = {}
        origin = request.headers.get("origin")
        if origin and origin in get_settings().cors_origins:
            headers["Access-Control-Allow-Origin"] = origin
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_error_body("internal_error", "An unexpected error occurred."),
            headers=headers,
        )
