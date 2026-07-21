from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration, loaded from environment variables / .env.

    Every value is validated at startup. If a required setting is missing
    or has the wrong type, the app refuses to boot - which is exactly what
    you want: fail fast, not in the middle of a request.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application ---
    app_name: str = "MediVault API"
    environment: Literal["development", "test", "production"] = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"

    # --- Database ---
    # Postgres in real use; SQLite (aiosqlite) works for quick local tests.
    database_url: str = "postgresql+asyncpg://medivault:medivault@localhost:5432/medivault"

    # --- Auth ---
    # MUST be overridden via environment in production.
    jwt_secret: str = "dev-only-change-me"
    access_token_minutes: int = 15
    refresh_token_days: int = 7
    wallet_challenge_minutes: int = 5
    # Dev convenience: lets /docs testing pass 'mock:<address>' signatures.
    # Ignored (forced off) when environment=production.
    allow_mock_wallet_signatures: bool = False

    # --- Cardano / Blockfrost ---
    blockfrost_project_id: str = ""
    # The pool's deposit address on preprod (premiums are paid here).
    pool_wallet_address: str = "addr_test1qpoolwalletplaceholder"
    min_tx_confirmations: int = 1
    # Dev convenience: 'mocktx:<from>:<lovelace>' hashes. Forced off in production.
    allow_mock_chain: bool = False

    # Treasury: max share of the pool deployable to yield (basis points).
    allocation_cap_bps: int = 8000  # 80.00%

    # --- Logging ---
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    # --- CORS: which frontend origins may call this API ---
    cors_origins: list[str] = ["http://localhost:3000"]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    """Cached accessor so the .env file is parsed exactly once."""
    return Settings()
