import re
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.category import Category
from app.models.group import GroupMember
from app.models.transaction import Transaction
from app.models.user import User
from app.services.balance_service import BalanceService
from app.routers.categories import seed_default_categories

class AIService:
    @staticmethod
    def parse_natural_language_expense(db: Session, text: str, group_id: str, current_user_id: str) -> Dict[str, Any]:
        """
        Parses text like: "I paid 650 for dinner yesterday" or "Rahul paid 1200 for electricity"
        Extracts amount, description, category, payer, date, split type.
        """
        seed_default_categories(db)
        clean_text = text.strip()
        
        # Extract Amount
        amount_match = re.search(r'(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)', clean_text, re.IGNORECASE)
        amount = float(amount_match.group(1)) if amount_match else 0.0

        # Determine Payer
        members = db.query(GroupMember).filter(GroupMember.group_id == group_id).all()
        user_ids = [m.user_id for m in members]
        users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}
        
        paid_by = current_user_id
        for uid, user_obj in users.items():
            if uid != current_user_id and user_obj.name.lower() in clean_text.lower():
                paid_by = uid
                break

        # Category Matching
        categories = db.query(Category).all()
        matched_category_id = None
        category_name = "Other"

        category_keywords = {
            "Food": ["dinner", "lunch", "breakfast", "food", "restaurant", "pizza", "burger", "coffee", "zomato", "swiggy"],
            "Groceries": ["groceries", "grocery", "supermarket", "vegetables", "milk", "zepto", "blinkit", "instamart"],
            "Electricity": ["electricity", "power", "light bill", "eb bill"],
            "Internet": ["internet", "wifi", "broadband", "recharge"],
            "Rent": ["rent", "flat rent", "house rent"],
            "Travel": ["travel", "cab", "uber", "ola", "flight", "train", "petrol", "diesel", "fuel"],
            "Entertainment": ["movie", "netflix", "prime", "cinema", "game", "party"],
            "Medical": ["doctor", "medicine", "pharmacy", "hospital"],
            "Shopping": ["clothes", "amazon", "flipkart", "shopping"],
        }

        for cat_label, keywords in category_keywords.items():
            for kw in keywords:
                if kw in clean_text.lower():
                    cat_obj = next((c for c in categories if c.name.lower() == cat_label.lower()), None)
                    if cat_obj:
                        matched_category_id = cat_obj.id
                        category_name = cat_obj.name
                    break
            if matched_category_id:
                break

        if not matched_category_id:
            other_cat = next((c for c in categories if c.name == "Other"), None)
            matched_category_id = other_cat.id if other_cat else (categories[0].id if categories else "")

        # Description Extraction
        description = clean_text
        desc_match = re.search(r'for\s+([a-zA-Z0-9\s]+?)(?:yesterday|today|rs|\d|$)', clean_text, re.IGNORECASE)
        if desc_match:
            description = desc_match.group(1).strip().capitalize()

        # Date Detection
        tx_date = datetime.now(timezone.utc)
        if "yesterday" in clean_text.lower():
            tx_date = datetime.now(timezone.utc) - timedelta(days=1)

        return {
            "amount": amount,
            "description": description,
            "category_id": matched_category_id,
            "category_name": category_name,
            "paid_by": paid_by,
            "paid_by_name": users[paid_by].name if paid_by in users else "You",
            "split_type": "50_50",
            "transaction_type": "EXPENSE",
            "transaction_date": tx_date.isoformat(),
            "confidence": 0.92
        }

    @staticmethod
    def query_natural_language(db: Session, query: str, group_id: str, current_user_id: str) -> Dict[str, Any]:
        seed_default_categories(db)
        q_lower = query.lower().strip()
        bal = BalanceService.calculate_group_balance(db, group_id, current_user_id)
        
        members = db.query(GroupMember).filter(GroupMember.group_id == group_id).all()
        user_ids = [m.user_id for m in members]
        users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}

        txs = (
            db.query(Transaction)
            .filter(Transaction.group_id == group_id, Transaction.deleted_at.is_(None))
            .all()
        )
        expense_txs = [t for t in txs if t.transaction_type == "EXPENSE"]

        # Question 1: Who owes whom?
        if "who owes" in q_lower or "balance" in q_lower or "settled" in q_lower:
            if bal["status"] == "settled" or bal["amount"] == 0:
                answer = "You are all settled up! There is no pending balance between group members."
            elif bal["status"] == "you_are_owed":
                answer = f"{bal['other_user_name']} owes you ₹{bal['amount']:,.2f}."
            else:
                answer = f"You owe {bal['other_user_name']} ₹{bal['amount']:,.2f}."
            return {"query": query, "answer": answer, "data": bal}

        # Question 2: Biggest expense
        if "biggest" in q_lower or "largest" in q_lower or "highest" in q_lower:
            if not expense_txs:
                return {"query": query, "answer": "No expenses have been recorded yet."}
            biggest = max(expense_txs, key=lambda x: float(x.amount))
            payer_name = users[biggest.paid_by].name if biggest.paid_by in users else "Member"
            answer = f"The largest expense was '{biggest.description}' of ₹{float(biggest.amount):,.2f} paid by {payer_name}."
            return {"query": query, "answer": answer, "transaction_id": biggest.id}

        # Question 3: Category spending (e.g. food, groceries, rent)
        categories = db.query(Category).all()
        for cat in categories:
            if cat.name.lower() in q_lower:
                cat_txs = [t for t in expense_txs if t.category_id == cat.id]
                total = sum((Decimal(str(t.amount)) for t in cat_txs), Decimal('0.00'))
                answer = f"Total spent on {cat.name} is ₹{float(total):,.2f} across {len(cat_txs)} transactions."
                return {"query": query, "answer": answer, "category": cat.name, "total": float(total)}

        # Question 4: Member specific spending
        for uid, user_obj in users.items():
            if user_obj.name.lower() in q_lower:
                member_txs = [t for t in expense_txs if t.paid_by == uid]
                total = sum((Decimal(str(t.amount)) for t in member_txs), Decimal('0.00'))
                answer = f"{user_obj.name} has physically paid ₹{float(total):,.2f} out of pocket across {len(member_txs)} transactions."
                return {"query": query, "answer": answer, "user_name": user_obj.name, "total": float(total)}

        # Fallback General Summary
        total_exp = sum((Decimal(str(t.amount)) for t in expense_txs), Decimal('0.00'))
        answer = f"Total group expenses to date are ₹{float(total_exp):,.2f} across {len(expense_txs)} transactions."
        return {"query": query, "answer": answer, "total_expenses": float(total_exp)}
