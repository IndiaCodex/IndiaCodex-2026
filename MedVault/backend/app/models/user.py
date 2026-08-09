from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import UserRole
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, native_enum=False, length=20), default=UserRole.USER
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    wallets: Mapped[list["Wallet"]] = relationship(back_populates="user")
    policies: Mapped[list["Policy"]] = relationship(back_populates="user")  # noqa: F821


class Wallet(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "wallets"

    user_id: Mapped["Uuid"] = mapped_column(Uuid, ForeignKey("users.id"), index=True)
    address: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    network: Mapped[str] = mapped_column(String(20), default="preprod")
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped[User] = relationship(back_populates="wallets")
