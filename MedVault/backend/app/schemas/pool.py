import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AllocationStatus


class PoolStatus(BaseModel):
    total_pool_lovelace: int
    allocated_lovelace: int
    liquid_lovelace: int
    allocation_cap_bps: int
    current_allocation_bps: int
    premiums_collected_lovelace: int
    yield_earned_lovelace: int
    claims_paid_lovelace: int


class AllocationCreate(BaseModel):
    strategy: str = Field(min_length=3, max_length=60)
    amount_lovelace: int = Field(gt=0)


class AllocationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    strategy: str
    amount_lovelace: int
    target_bps: int
    status: AllocationStatus
    tx_hash: Optional[str]
    created_at: datetime
