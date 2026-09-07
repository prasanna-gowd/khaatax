from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.group import GroupMember
from app.models.user import User
from app.services.balance_service import BalanceService

class AnalyticsService:
    @staticmethod
    def get_group_analytics(db: Session, group_id: str, current_user_id: str) -> Dict[str, Any]:
        # Get active group members
        members = db.query(GroupMember).filter(GroupMember.group_id == group_id).all()
        user_ids = [m.user_id for m in members]
        users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}

        # Fetch non-deleted transactions
        txs = (
            db.query(Transaction)
            .filter(
                Transaction.group_id == group_id,
                Transaction.deleted_at.is_(None)
            )
            .all()
        )

        expense_txs = [t for t in txs if t.transaction_type == "EXPENSE"]

        total_expenses = sum((Decimal(str(t.amount)) for t in expense_txs), Decimal('0.00'))

        # Contributions by paid_by
        paid_by_map: Dict[str, Decimal] = {uid: Decimal('0.00') for uid in user_ids}
        consumed_map: Dict[str, Decimal] = {uid: Decimal('0.00') for uid in user_ids}

        for t in expense_txs:
            amt = Decimal(str(t.amount))
            if t.paid_by in paid_by_map:
                paid_by_map[t.paid_by] += amt

            if t.split_type == "50_50" and len(user_ids) == 2:
                half = (amt / Decimal('2.00')).quantize(Decimal('0.01'))
                consumed_map[user_ids[0]] += half
                consumed_map[user_ids[1]] += (amt - half)
            elif t.split_type == "FULL_AMOUNT":
                target = t.received_by or t.paid_by
                if target in consumed_map:
                    consumed_map[target] += amt
            elif t.split_type == "CUSTOM" and t.split_details:
                for uid, share in t.split_details.items():
                    if uid in consumed_map:
                        consumed_map[uid] += Decimal(str(share))

        my_paid = paid_by_map.get(current_user_id, Decimal('0.00'))
        other_user_id = next((uid for uid in user_ids if uid != current_user_id), None)
        other_paid = paid_by_map.get(other_user_id, Decimal('0.00')) if other_user_id else Decimal('0.00')

        # Current month spending
        now = datetime.now(timezone.utc)
        current_month_spending = sum(
            (Decimal(str(t.amount)) for t in expense_txs if t.transaction_date.year == now.year and t.transaction_date.month == now.month),
            Decimal('0.00')
        )

        # Category Breakdown
        categories = {c.id: c for c in db.query(Category).all()}
        cat_sums: Dict[str, Decimal] = {}
        for t in expense_txs:
            cat_id = t.category_id
            cat_sums[cat_id] = cat_sums.get(cat_id, Decimal('0.00')) + Decimal(str(t.amount))

        category_breakdown = []
        for cat_id, cat_amt in cat_sums.items():
            cat_obj = categories.get(cat_id)
            cat_name = cat_obj.name if cat_obj else "Other"
            cat_icon = cat_obj.icon if cat_obj else "tag"
            percentage = float((cat_amt / total_expenses * Decimal('100.00')).quantize(Decimal('0.1'))) if total_expenses > 0 else 0.0
            category_breakdown.append({
                "category_name": cat_name,
                "icon": cat_icon,
                "total_amount": float(cat_amt),
                "percentage": percentage
            })
        category_breakdown.sort(key=lambda x: x["total_amount"], reverse=True)

        # Spending Trend (Daily aggregated over time)
        trend_map: Dict[str, Decimal] = {}
        for t in sorted(expense_txs, key=lambda x: x.transaction_date):
            date_str = t.transaction_date.strftime("%Y-%m-%d")
            trend_map[date_str] = trend_map.get(date_str, Decimal('0.00')) + Decimal(str(t.amount))

        spending_trend = [
            {"date": d, "amount": float(amt)}
            for d, amt in trend_map.items()
        ]

        # Member contribution breakdown
        member_contributions = []
        for uid in user_ids:
            u_obj = users.get(uid)
            u_name = u_obj.name if u_obj else "Member"
            t_paid = paid_by_map[uid]
            pct = float((t_paid / total_expenses * Decimal('100.00')).quantize(Decimal('0.1'))) if total_expenses > 0 else 0.0
            member_contributions.append({
                "user_id": uid,
                "user_name": u_name,
                "total_paid": float(t_paid),
                "total_share": float(consumed_map[uid]),
                "percentage": pct
            })

        # Calculate current balance
        bal_data = BalanceService.calculate_group_balance(db, group_id, current_user_id)

        return {
            "total_expenses": float(total_expenses),
            "my_contribution": float(my_paid),
            "other_member_contribution": float(other_paid),
            "current_balance": bal_data["amount"],
            "balance_status": bal_data["status"],
            "transaction_count": len(txs),
            "current_month_spending": float(current_month_spending),
            "category_breakdown": category_breakdown,
            "spending_trend": spending_trend,
            "member_contributions": member_contributions
        }
