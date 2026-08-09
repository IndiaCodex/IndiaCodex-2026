import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ChallengeRequest(BaseModel):
    address: str = Field(min_length=10, max_length=120, pattern=r"^addr(_test)?1[a-z0-9]+$")


class ChallengeResponse(BaseModel):
    nonce: str
    expires_at: datetime


class VerifyRequest(BaseModel):
    address: str = Field(min_length=10, max_length=120)
    signature: str = Field(max_length=4000)
    key: str = Field(default="", max_length=2000)


class WalletOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    address: str
    network: str
    is_verified: bool
    verified_at: Optional[datetime]
    created_at: datetime
