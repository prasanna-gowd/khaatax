import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey
from app.core.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), unique=True, nullable=False)
    icon = Column(String(50), nullable=False, default="tag")
    is_custom = Column(Boolean, default=False, nullable=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)
