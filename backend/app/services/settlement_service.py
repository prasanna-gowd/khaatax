from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.settlement import Settlement
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.group import GroupMember
from app.schemas.settlement import SettlementCreate

class SettlementService:
    @staticmethod
    def create_settlement(db: Session, group_id: str, settle_in: SettlementCreate, payer_id: str) -> Settlement:
        # Check membership for payer and payee
        payer_member = db.query(GroupMember).filter(
            GroupMember.group_id == group_id, GroupMember.user_id == payer_id
        ).first()
        payee_member = db.query(GroupMember).filter(
            GroupMember.group_id == group_id, GroupMember.user_id == settle_in.payee_id
        ).first()

        if not payer_member or not payee_member:
            raise HTTPException(status_code=403, detail="Both payer and payee must be group members")

        # Find or ensure Settlement category
        settle_cat = db.query(Category).filter(Category.name == "Settlement").first()
        if not settle_cat:
            settle_cat = Category(name="Settlement", icon="hand-coins", is_custom=False)
            db.add(settle_cat)
            db.flush()

        # Create underlying transaction record
        tx = Transaction(
            group_id=group_id,
            created_by=payer_id,
            paid_by=payer_id,
            received_by=settle_in.payee_id,
            amount=settle_in.amount,
            transaction_type="SETTLEMENT",
            description=f"Settlement via {settle_in.payment_method}",
            category_id=settle_cat.id,
            split_type="FULL_AMOUNT",
            transaction_date=datetime.now(timezone.utc),
            notes=settle_in.reference_note
        )
        db.add(tx)
        db.flush()

        # Create settlement record
        settlement = Settlement(
            group_id=group_id,
            transaction_id=tx.id,
            payer_id=payer_id,
            payee_id=settle_in.payee_id,
            amount=settle_in.amount,
            payment_method=settle_in.payment_method,
            reference_note=settle_in.reference_note
        )
        db.add(settlement)
        db.commit()
        db.refresh(settlement)
        return settlement
