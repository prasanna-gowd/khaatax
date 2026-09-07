from datetime import datetime, timezone
from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.group import GroupMember
from app.models.category import Category
from app.schemas.transaction import TransactionCreate, TransactionUpdate

class TransactionService:
    @staticmethod
    def create_transaction(db: Session, group_id: str, tx_in: TransactionCreate, user_id: str) -> Transaction:
        # Check membership
        member = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id
        ).first()
        if not member:
            raise HTTPException(status_code=403, detail="Not a group member")

        # Validate Category
        category = db.query(Category).filter(Category.id == tx_in.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

        # Validate Custom Split totals
        if tx_in.split_type == "CUSTOM":
            if not tx_in.split_details:
                raise HTTPException(status_code=400, detail="Custom split requires split_details mapping")
            
            total_split = sum(Decimal(str(v)) for v in tx_in.split_details.values())
            if abs(total_split - tx_in.amount) > Decimal('0.01'):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Sum of custom splits ({total_split}) must equal total transaction amount ({tx_in.amount})"
                )

        tx = Transaction(
            group_id=group_id,
            created_by=user_id,
            paid_by=tx_in.paid_by,
            received_by=tx_in.received_by,
            amount=tx_in.amount,
            transaction_type=tx_in.transaction_type,
            description=tx_in.description.strip(),
            category_id=tx_in.category_id,
            split_type=tx_in.split_type,
            split_details={k: float(v) for k, v in tx_in.split_details.items()} if tx_in.split_details else None,
            transaction_date=tx_in.transaction_date or datetime.now(timezone.utc),
            notes=tx_in.notes.strip() if tx_in.notes else None
        )
        db.add(tx)
        db.commit()
        db.refresh(tx)
        return tx

    @staticmethod
    def list_transactions(db: Session, group_id: str, user_id: str) -> list[Transaction]:
        # Check membership
        member = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id
        ).first()
        if not member:
            raise HTTPException(status_code=403, detail="Not a group member")

        return (
            db.query(Transaction)
            .filter(
                Transaction.group_id == group_id,
                Transaction.deleted_at.is_(None)
            )
            .order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())
            .all()
        )

    @staticmethod
    def get_transaction_by_id(db: Session, transaction_id: str, user_id: str) -> Transaction:
        tx = db.query(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.deleted_at.is_(None)
        ).first()
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")

        # Check user belongs to transaction's group
        member = db.query(GroupMember).filter(
            GroupMember.group_id == tx.group_id,
            GroupMember.user_id == user_id
        ).first()
        if not member:
            raise HTTPException(status_code=403, detail="Access denied")

        return tx

    @staticmethod
    def update_transaction(db: Session, transaction_id: str, tx_in: TransactionUpdate, user_id: str) -> Transaction:
        tx = TransactionService.get_transaction_by_id(db, transaction_id, user_id)

        if tx_in.amount is not None:
            tx.amount = tx_in.amount
        if tx_in.description is not None:
            tx.description = tx_in.description.strip()
        if tx_in.category_id is not None:
            category = db.query(Category).filter(Category.id == tx_in.category_id).first()
            if not category:
                raise HTTPException(status_code=404, detail="Category not found")
            tx.category_id = tx_in.category_id
        if tx_in.split_type is not None:
            tx.split_type = tx_in.split_type
        if tx_in.split_details is not None:
            if tx.split_type == "CUSTOM":
                total_split = sum(Decimal(str(v)) for v in tx_in.split_details.values())
                if abs(total_split - tx.amount) > Decimal('0.01'):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Sum of custom splits ({total_split}) must equal transaction amount ({tx.amount})"
                    )
            tx.split_details = {k: float(v) for k, v in tx_in.split_details.items()}
        if tx_in.transaction_date is not None:
            tx.transaction_date = tx_in.transaction_date
        if tx_in.notes is not None:
            tx.notes = tx_in.notes.strip()

        tx.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(tx)
        return tx

    @staticmethod
    def soft_delete_transaction(db: Session, transaction_id: str, user_id: str) -> bool:
        tx = TransactionService.get_transaction_by_id(db, transaction_id, user_id)
        tx.deleted_at = datetime.now(timezone.utc)
        db.commit()
        return True
