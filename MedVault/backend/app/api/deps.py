import uuid
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_token
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.blockchain.cardano.mock_signature import MockSignatureVerifier
from app.blockchain.cardano.signature import Cip8SignatureVerifier
from app.blockchain.cardano.blockfrost_client import BlockfrostChainClient
from app.blockchain.cardano.mock_chain import MockChainAdapter
from app.blockchain.midnight.mock_vault import MockMidnightVault
from app.blockchain.midnight.mock_verifier import MockMidnightVerifier
from app.blockchain.ports import CardanoChainPort, PrivateVaultPort, SignatureVerifierPort, ZKProofVerifierPort
from app.core.config import get_settings

# auto_error=False so a missing header raises OUR error shape, not FastAPI's.
_bearer = HTTPBearer(auto_error=False)

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    session: DbSession,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(_bearer)
    ] = None,
) -> User:
    """Reads 'Authorization: Bearer <access token>' and returns the user.

    Any route that declares this dependency is protected - no decorator
    soup, no per-route boilerplate.
    """
    if credentials is None:
        raise UnauthorizedError("Missing authentication token.")
    payload = decode_token(credentials.credentials, expected_type="access")
    if payload is None:
        raise UnauthorizedError("Invalid or expired token.")
    user = await UserRepository(session).get_by_id(uuid.UUID(payload["sub"]))
    if user is None or not user.is_active:
        raise UnauthorizedError("Account not found or disabled.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def require_admin(user: CurrentUser) -> User:
    """RBAC: stack on top of get_current_user for admin-only routes."""
    if user.role != UserRole.ADMIN:
        raise ForbiddenError("Administrator access required.")
    return user


AdminUser = Annotated[User, Depends(require_admin)]


def get_signature_verifier() -> SignatureVerifierPort:
    """Wiring: which verifier implementation to use.

    The mock is ONLY reachable outside production - a config mistake
    cannot disable real crypto where it matters.
    """
    settings = get_settings()
    if settings.allow_mock_wallet_signatures and not settings.is_production:
        return MockSignatureVerifier()
    return Cip8SignatureVerifier()


SignatureVerifier = Annotated[SignatureVerifierPort, Depends(get_signature_verifier)]


def get_private_vault() -> PrivateVaultPort:
    """Hackathon: mock Midnight vault. Production: real Midnight adapter -
    swap happens here, in one line."""
    return MockMidnightVault()


PrivateVault = Annotated[PrivateVaultPort, Depends(get_private_vault)]


def get_chain() -> CardanoChainPort:
    """Real Blockfrost preprod client, or the dev mock chain.

    Like the signature verifier: the mock is unreachable in production.
    """
    settings = get_settings()
    if settings.allow_mock_chain and not settings.is_production:
        return MockChainAdapter()
    return BlockfrostChainClient()


Chain = Annotated[CardanoChainPort, Depends(get_chain)]


def get_zk_verifier() -> ZKProofVerifierPort:
    """Hackathon: mock Midnight circuit. Production: on-chain verification."""
    return MockMidnightVerifier()


ZkVerifier = Annotated[ZKProofVerifierPort, Depends(get_zk_verifier)]
