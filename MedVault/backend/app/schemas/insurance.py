import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import PolicyStatus


class PlanCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    description: Optional[str] = Field(default=None, max_length=500)
    coverage_lovelace: int = Field(gt=0)
    premium_lovelace: int = Field(gt=0)
    period_days: int = Field(default=30, ge=1, le=365)
    max_claims_per_year: int = Field(default=12, ge=1, le=100)


class PlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: Optional[str]
    coverage_lovelace: int
    premium_lovelace: int
    period_days: int
    max_claims_per_year: int
    is_active: bool


class EnrollRequest(BaseModel):
    plan_id: uuid.UUID


class PolicyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    plan_id: uuid.UUID
    status: PolicyStatus
    commitment_hash: str
    start_date: Optional[datetime]
    next_premium_due: Optional[datetime]
    created_at: datetime
