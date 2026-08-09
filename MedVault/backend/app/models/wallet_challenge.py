from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class WalletChallenge(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """A one-time nonce the user must sign to prove wallet ownership.

    Single-use + short expiry = a captured signature can't be replayed.
    """

    __tablename__ = "wallet_challenges"

    user_id: Mapped["Uuid"] = mapped_column(Uuid, ForeignKey("users.id"), index=True)
    address: Mapped[str] = mapped_column(String(120), index=True)
    nonce: Mapped[str] = mapped_column(String(120), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
