import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import PaymentStatus


class DepositRequest(BaseModel):
    policy_id: uuid.UUID
    tx_hash: str = Field(min_length=8, max_length=120)


class PremiumOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    policy_id: uuid.UUID
    amount_lovelace: int
    tx_hash: str
    status: PaymentStatus
    confirmed_at: Optional[datetime]
    created_at: datetime
