from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.analytics import AnalyticsOut
from app.services.analytics_service import AnalyticsService
from app.services.group_service import GroupService
from app.routers.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/groups", tags=["Analytics"])

@router.get("/{group_id}/analytics", response_model=AnalyticsOut)
def get_analytics(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify group membership first
    GroupService.get_group_by_id(db, group_id, current_user.id)
    return AnalyticsService.get_group_analytics(db, group_id, current_user.id)
