import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ClaimStatus


class ClaimSubmit(BaseModel):
    policy_id: uuid.UUID
    amount_lovelace: int = Field(gt=0)
    # Opaque to us: in production this is a real ZK proof blob.
    proof_payload: dict


class ClaimOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    policy_id: uuid.UUID
    claim_reference: str
    amount_lovelace: int
    status: ClaimStatus
    payout_tx_hash: Optional[str]
    decided_at: Optional[datetime]
    created_at: datetime
