from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.ai_service import AIService
from app.services.group_service import GroupService
from app.routers.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/groups", tags=["AI & Voice Features"])

class ParseTextRequest(BaseModel):
    text: str

class QueryRequest(BaseModel):
    query: str

@router.post("/{group_id}/ai/parse-text")
def parse_expense_text(
    group_id: str,
    req: ParseTextRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    GroupService.get_group_by_id(db, group_id, current_user.id)
    return AIService.parse_natural_language_expense(db, req.text, group_id, current_user.id)

@router.post("/{group_id}/ai/query")
def query_ai_ledger(
    group_id: str,
    req: QueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    GroupService.get_group_by_id(db, group_id, current_user.id)
    return AIService.query_natural_language(db, req.query, group_id, current_user.id)
