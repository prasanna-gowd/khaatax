from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.auth import UserOut

class SettlementCreate(BaseModel):
    payee_id: str
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    payment_method: str = Field("UPI", pattern="^(CASH|UPI|BANK_TRANSFER|OTHER)$")
    reference_note: Optional[str] = None

class SettlementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    group_id: str
    transaction_id: str
    payer_id: str
    payee_id: str
    amount: Decimal
    payment_method: str
    reference_note: Optional[str] = None
    settled_at: datetime

    payer: Optional[UserOut] = None
    payee: Optional[UserOut] = None
