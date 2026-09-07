from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryOut
from app.routers.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/categories", tags=["Categories"])

DEFAULT_CATEGORIES = [
    {"name": "Food", "icon": "utensils"},
    {"name": "Rent", "icon": "home"},
    {"name": "Electricity", "icon": "zap"},
    {"name": "Internet", "icon": "wifi"},
    {"name": "Groceries", "icon": "shopping-cart"},
    {"name": "Travel", "icon": "plane"},
    {"name": "Entertainment", "icon": "tv"},
    {"name": "Medical", "icon": "heart-pulse"},
    {"name": "Shopping", "icon": "shopping-bag"},
    {"name": "Settlement", "icon": "hand-coins"},
    {"name": "Other", "icon": "tag"},
]

class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    icon: str = Field("tag", max_length=50)

def seed_default_categories(db: Session):
    for cat in DEFAULT_CATEGORIES:
        existing = db.query(Category).filter(Category.name == cat["name"]).first()
        if not existing:
            db.add(Category(name=cat["name"], icon=cat["icon"], is_custom=False))
    db.commit()

@router.get("", response_model=list[CategoryOut])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    seed_default_categories(db)
    return db.query(Category).order_by(Category.name.asc()).all()

@router.post("", response_model=CategoryOut)
def create_custom_category(
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Category).filter(Category.name == cat_in.name.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name already exists")
    
    category = Category(
        name=cat_in.name.strip(),
        icon=cat_in.icon,
        is_custom=True,
        created_by=current_user.id
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category
