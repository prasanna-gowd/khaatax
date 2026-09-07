import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Settlement(Base):
    __tablename__ = "settlements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id = Column(String(36), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_id = Column(String(36), ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    payer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    payee_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    amount = Column(Numeric(12, 2), nullable=False)
    payment_method = Column(String(30), nullable=False, default="UPI")  # CASH, UPI, BANK_TRANSFER, OTHER
    reference_note = Column(Text, nullable=True)
    settled_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    group = relationship("Group", back_populates="settlements")
    transaction = relationship("Transaction", back_populates="settlement")
    payer = relationship("User", foreign_keys=[payer_id])
    payee = relationship("User", foreign_keys=[payee_id])
