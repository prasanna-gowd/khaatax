from decimal import Decimal
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from app.models.group import GroupMember
from app.models.transaction import Transaction
from app.models.user import User

class BalanceService:
    @staticmethod
    def calculate_group_balance(db: Session, group_id: str, current_user_id: str) -> Dict[str, Any]:
        """
        Calculates exact group balance for 2-member shared ledger.
        Uses exact Decimal fixed-point arithmetic.
        """
        # Fetch active group members
        members = db.query(GroupMember).filter(GroupMember.group_id == group_id).all()
        user_ids = [m.user_id for m in members]
        
        # User details map
        users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}

        # Initialize tracking maps
        # total_paid: money physically paid out of pocket by each user
        # total_consumed: expense share consumed/owed by each user
        total_paid: Dict[str, Decimal] = {uid: Decimal('0.00') for uid in user_ids}
        total_consumed: Dict[str, Decimal] = {uid: Decimal('0.00') for uid in user_ids}
        total_settled_paid: Dict[str, Decimal] = {uid: Decimal('0.00') for uid in user_ids}

        # Fetch non-deleted transactions for this group
        transactions = (
            db.query(Transaction)
            .filter(
                Transaction.group_id == group_id,
                Transaction.deleted_at.is_(None)
            )
            .order_by(Transaction.transaction_date.asc(), Transaction.created_at.asc())
            .all()
        )

        for tx in transactions:
            tx_amount = Decimal(str(tx.amount))
            payer_id = tx.paid_by

            if tx.transaction_type == "EXPENSE":
                # Payer physically paid out tx_amount
                if payer_id in total_paid:
                    total_paid[payer_id] += tx_amount

                # Calculate consumed share based on split_type
                if tx.split_type == "50_50":
                    if len(user_ids) == 2:
                        half = (tx_amount / Decimal('2.00')).quantize(Decimal('0.01'))
                        # To avoid 1 cent rounding mismatch (e.g. 10.05 / 2)
                        other_half = tx_amount - half
                        u1, u2 = user_ids[0], user_ids[1]
                        total_consumed[u1] += half
                        total_consumed[u2] += other_half
                    elif len(user_ids) == 1:
                        total_consumed[user_ids[0]] += tx_amount

                elif tx.split_type == "FULL_AMOUNT":
                    # Full amount assigned to receiver if specified, else assigned to payer
                    target_id = tx.received_by or payer_id
                    if target_id in total_consumed:
                        total_consumed[target_id] += tx_amount

                elif tx.split_type == "CUSTOM" and tx.split_details:
                    for uid, share in tx.split_details.items():
                        if uid in total_consumed:
                            total_consumed[uid] += Decimal(str(share))

            elif tx.transaction_type in ("SETTLEMENT", "PAYMENT"):
                # Payer transferred tx_amount directly to Receiver
                payee_id = tx.received_by
                if payer_id in total_settled_paid:
                    total_settled_paid[payer_id] += tx_amount
                if payee_id in total_settled_paid:
                    total_settled_paid[payee_id] -= tx_amount

        # Calculate net position for each user
        # Net Position = Total Paid - Total Consumed + Net Settlements Transferred
        # Positive Net Position = User is owed money
        # Negative Net Position = User owes money
        net_positions: Dict[str, Decimal] = {}
        for uid in user_ids:
            net_positions[uid] = total_paid[uid] - total_consumed[uid] + total_settled_paid[uid]

        # Identify other member in pair
        other_user_id = next((uid for uid in user_ids if uid != current_user_id), None)
        my_position = net_positions.get(current_user_id, Decimal('0.00'))

        status = "settled"
        amount = Decimal('0.00')
        debtor_id = None
        creditor_id = None

        if my_position > Decimal('0.00'):
            status = "you_are_owed"
            amount = my_position
            creditor_id = current_user_id
            debtor_id = other_user_id
        elif my_position < Decimal('0.00'):
            status = "you_owe"
            amount = abs(my_position)
            creditor_id = other_user_id
            debtor_id = current_user_id

        # Member summaries for breakdown display
        member_summaries = []
        for uid in user_ids:
            u_obj = users.get(uid)
            member_summaries.append({
                "user_id": uid,
                "name": u_obj.name if u_obj else "Unknown",
                "email_or_phone": u_obj.email_or_phone if u_obj else "",
                "total_paid": float(total_paid[uid]),
                "total_consumed": float(total_consumed[uid]),
                "net_position": float(net_positions[uid])
            })

        return {
            "group_id": group_id,
            "status": status,  # "you_owe", "you_are_owed", "settled"
            "amount": float(amount),
            "debtor_id": debtor_id,
            "creditor_id": creditor_id,
            "current_user_id": current_user_id,
            "other_user_id": other_user_id,
            "other_user_name": users[other_user_id].name if other_user_id and other_user_id in users else None,
            "members": member_summaries
        }
