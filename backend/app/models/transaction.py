import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id = Column(String(36), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    paid_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    received_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    amount = Column(Numeric(12, 2), nullable=False)
    transaction_type = Column(String(20), nullable=False)  # EXPENSE, PAYMENT, SETTLEMENT
    description = Column(String(255), nullable=False)
    category_id = Column(String(36), ForeignKey("categories.id"), nullable=False)
    
    split_type = Column(String(20), nullable=False, default="50_50")  # 50_50, FULL_AMOUNT, CUSTOM
    split_details = Column(JSON, nullable=True)  # dict of {user_id: amount}
    
    transaction_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    deleted_at = Column(DateTime, nullable=True, index=True)

    group = relationship("Group", back_populates="transactions")
    creator = relationship("User", foreign_keys=[created_by])
    payer = relationship("User", foreign_keys=[paid_by])
    receiver = relationship("User", foreign_keys=[received_by])
    category = relationship("Category")
    settlement = relationship("Settlement", back_populates="transaction", uselist=False, cascade="all, delete-orphan")
