from decimal import Decimal
from pydantic import BaseModel

class CategorySpending(BaseModel):
    category_name: str
    icon: str
    total_amount: Decimal
    percentage: float

class SpendingTrend(BaseModel):
    date: str  # YYYY-MM-DD
    amount: Decimal

class MemberContribution(BaseModel):
    user_id: str
    user_name: str
    total_paid: Decimal
    total_share: Decimal
    percentage: float

class AnalyticsOut(BaseModel):
    total_expenses: Decimal
    my_contribution: Decimal
    other_member_contribution: Decimal
    current_balance: Decimal
    transaction_count: int
    current_month_spending: Decimal
    category_breakdown: list[CategorySpending]
    spending_trend: list[SpendingTrend]
    member_contributions: list[MemberContribution]
