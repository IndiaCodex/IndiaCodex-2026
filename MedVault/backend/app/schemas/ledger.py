import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import PaymentStatus, TransactionDirection, TransactionType


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: TransactionType
    direction: TransactionDirection
    amount_lovelace: int
    tx_hash: Optional[str]
    status: PaymentStatus
    created_at: datetime


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    actor_id: Optional[uuid.UUID]
    action: str
    entity: str
    entity_id: Optional[str]
    created_at: datetime
