import uuid

from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import AdminUser, CurrentUser, DbSession
from app.models.ledger import AuditLog, Transaction
from app.schemas.ledger import AuditLogOut, TransactionOut

router = APIRouter(tags=["ledger"])


@router.get("/transactions/me", response_model=list[TransactionOut])
async def my_transactions(user: CurrentUser, session: DbSession) -> list[TransactionOut]:
    result = await session.execute(
        select(Transaction)
        .where(Transaction.user_id == user.id)
        .order_by(Transaction.created_at.desc())
        .limit(200)
    )
    return [TransactionOut.model_validate(t) for t in result.scalars()]


@router.get("/audit-logs", response_model=list[AuditLogOut])
async def audit_logs(admin: AdminUser, session: DbSession) -> list[AuditLogOut]:
    result = await session.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(500)
    )
    return [AuditLogOut.model_validate(a) for a in result.scalars()]
