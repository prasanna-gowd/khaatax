from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.settlement import SettlementCreate, SettlementOut
from app.services.settlement_service import SettlementService
from app.services.balance_service import BalanceService
from app.routers.deps import get_current_user
from app.models.user import User
from app.websocket.manager import manager

router = APIRouter(prefix="/groups", tags=["Settlements"])

@router.post("/{group_id}/settle", response_model=SettlementOut, status_code=status.HTTP_201_CREATED)
async def settle_balance(
    group_id: str,
    settle_in: SettlementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    settlement = SettlementService.create_settlement(db, group_id, settle_in, current_user.id)
    balance = BalanceService.calculate_group_balance(db, group_id, current_user.id)
    await manager.broadcast_to_group(
        group_id=group_id,
        event_type="settlement_created",
        data={"settlement_id": settlement.id, "balance": balance}
    )
    return settlement
