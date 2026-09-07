from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.group_service import GroupService
from app.services.balance_service import BalanceService
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.user import User
from app.routers.deps import get_current_user
from datetime import datetime, timezone

router = APIRouter(prefix="/groups", tags=["PDF & Ledger Statements"])

@router.get("/{group_id}/statement")
def generate_group_statement(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = GroupService.get_group_by_id(db, group_id, current_user.id)
    balance_data = BalanceService.calculate_group_balance(db, group_id, current_user.id)
    
    txs = (
        db.query(Transaction)
        .filter(Transaction.group_id == group_id, Transaction.deleted_at.is_(None))
        .order_by(Transaction.transaction_date.desc())
        .all()
    )
    categories = {c.id: c for c in db.query(Category).all()}
    members = {m.user_id: m.user for m in group.members}

    # Generate clean printable HTML statement payload
    rows_html = ""
    for t in txs:
        cat_name = categories[t.category_id].name if t.category_id in categories else "General"
        payer_name = members[t.paid_by].name if t.paid_by in members else "Member"
        dt_str = t.transaction_date.strftime("%d %b %Y, %I:%M %p")
        rows_html += f"""
        <tr>
            <td style="padding:10px; border-bottom:1px solid #e2e8f0;">{dt_str}</td>
            <td style="padding:10px; border-bottom:1px solid #e2e8f0;">{t.description}</td>
            <td style="padding:10px; border-bottom:1px solid #e2e8f0;">{cat_name}</td>
            <td style="padding:10px; border-bottom:1px solid #e2e8f0;">{payer_name}</td>
            <td style="padding:10px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:bold;">₹{float(t.amount):,.2f}</td>
        </tr>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>KhaataX Statement - {group.name}</title>
        <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; }}
            .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; }}
            .title {{ font-size: 24px; font-weight: bold; color: #0f172a; }}
            .subtitle {{ color: #64748b; font-size: 14px; margin-top: 4px; }}
            .summary-box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th {{ background: #f1f5f9; padding: 12px 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #475569; }}
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <div class="title">KhaataX Shared Ledger Statement</div>
                <div class="subtitle">Group: <strong>{group.name}</strong> (Code: {group.code})</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:12px; color:#64748b;">Generated On</div>
                <div style="font-weight:bold;">{datetime.now(timezone.utc).strftime('%d %b %Y')}</div>
            </div>
        </div>

        <div class="summary-box">
            <h3 style="margin-top:0;">Ledger Summary</h3>
            <p style="font-size:16px;">Current Status: <strong>{balance_data['status'].replace('_', ' ').title()}</strong></p>
            <p style="font-size:20px; color:#10b981; font-weight:bold;">Outstanding Balance: ₹{balance_data['amount']:,.2f}</p>
        </div>

        <h3>Transaction History ({len(txs)} transactions)</h3>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Paid By</th>
                    <th style="text-align:right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                {rows_html}
            </tbody>
        </table>
    </body>
    </html>
    """
    return Response(content=html_content, media_type="text/html")
