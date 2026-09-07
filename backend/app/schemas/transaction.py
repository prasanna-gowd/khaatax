from datetime import datetime
from decimal import Decimal
from typing import Dict, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.auth import UserOut
from app.schemas.category import CategoryOut

class TransactionCreate(BaseModel):
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    transaction_type: str = Field(..., pattern="^(EXPENSE|PAYMENT|SETTLEMENT)$")
    description: str = Field(..., min_length=1, max_length=255)
    category_id: str
    paid_by: str
    received_by: Optional[str] = None
    split_type: str = Field("50_50", pattern="^(50_50|FULL_AMOUNT|CUSTOM)$")
    split_details: Optional[Dict[str, Decimal]] = None
    transaction_date: Optional[datetime] = None
    notes: Optional[str] = None

class TransactionUpdate(BaseModel):
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    category_id: Optional[str] = None
    split_type: Optional[str] = Field(None, pattern="^(50_50|FULL_AMOUNT|CUSTOM)$")
    split_details: Optional[Dict[str, Decimal]] = None
    transaction_date: Optional[datetime] = None
    notes: Optional[str] = None

class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    group_id: str
    created_by: str
    paid_by: str
    received_by: Optional[str] = None
    amount: Decimal
    transaction_type: str
    description: str
    category_id: str
    split_type: str
    split_details: Optional[Dict[str, float | Decimal]] = None
    transaction_date: datetime
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    category: Optional[CategoryOut] = None
    payer: Optional[UserOut] = None
    receiver: Optional[UserOut] = None
    creator: Optional[UserOut] = None
