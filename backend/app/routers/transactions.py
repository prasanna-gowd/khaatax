from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionOut
from app.services.transaction_service import TransactionService
from app.services.balance_service import BalanceService
from app.routers.deps import get_current_user
from app.models.user import User
from app.websocket.manager import manager

router = APIRouter(tags=["Transactions"])

@router.get("/groups/{group_id}/transactions", response_model=list[TransactionOut])
def list_group_transactions(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return TransactionService.list_transactions(db, group_id, current_user.id)

@router.post("/groups/{group_id}/transactions", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    group_id: str,
    tx_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = TransactionService.create_transaction(db, group_id, tx_in, current_user.id)
    
    # Broadcast realtime event
    balance = BalanceService.calculate_group_balance(db, group_id, current_user.id)
    await manager.broadcast_to_group(
        group_id=group_id,
        event_type="transaction_created",
        data={"transaction_id": tx.id, "balance": balance}
    )
    return tx

@router.get("/transactions/{transaction_id}", response_model=TransactionOut)
def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return TransactionService.get_transaction_by_id(db, transaction_id, current_user.id)

@router.put("/transactions/{transaction_id}", response_model=TransactionOut)
async def update_transaction(
    transaction_id: str,
    tx_in: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = TransactionService.update_transaction(db, transaction_id, tx_in, current_user.id)
    balance = BalanceService.calculate_group_balance(db, tx.group_id, current_user.id)
    await manager.broadcast_to_group(
        group_id=tx.group_id,
        event_type="transaction_updated",
        data={"transaction_id": tx.id, "balance": balance}
    )
    return tx

@router.delete("/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = TransactionService.get_transaction_by_id(db, transaction_id, current_user.id)
    group_id = tx.group_id
    TransactionService.soft_delete_transaction(db, transaction_id, current_user.id)
    balance = BalanceService.calculate_group_balance(db, group_id, current_user.id)
    await manager.broadcast_to_group(
        group_id=group_id,
        event_type="transaction_deleted",
        data={"transaction_id": transaction_id, "balance": balance}
    )
    return {"message": "Transaction deleted successfully"}
