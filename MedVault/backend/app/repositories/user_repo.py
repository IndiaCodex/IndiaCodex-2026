import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    """All database access for users lives here - services never write SQL."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self._session.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        return await self._session.get(User, user_id)

    async def create(self, email: str, hashed_password: str) -> User:
        user = User(email=email.lower(), hashed_password=hashed_password)
        self._session.add(user)
        await self._session.flush()  # assigns the UUID without committing
        return user
