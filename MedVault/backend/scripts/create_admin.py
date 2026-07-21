"""Promote a user to admin. Run: python -m scripts.create_admin you@email.com"""

import asyncio
import sys

from sqlalchemy import select

from app.db.session import SessionFactory
from app.models.enums import UserRole
from app.models.user import User


async def main(email: str) -> None:
    async with SessionFactory() as session:
        result = await session.execute(select(User).where(User.email == email.lower()))
        user = result.scalar_one_or_none()
        if user is None:
            print(f"No user found with email {email} - register first.")
            return
        user.role = UserRole.ADMIN
        await session.commit()
        print(f"{email} is now an admin.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: python -m scripts.create_admin <email>")
        sys.exit(1)
    asyncio.run(main(sys.argv[1]))
