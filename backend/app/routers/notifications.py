from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.notification import Notification
from app.services.group_service import GroupService
from app.routers.deps import get_current_user
from app.models.user import User

router = APIRouter(tags=["Notifications"])

@router.get("/groups/{group_id}/notifications")
def list_notifications(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    GroupService.get_group_by_id(db, group_id, current_user.id)
    return (
        db.query(Notification)
        .filter(Notification.group_id == group_id, Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(20)
        .all()
    )

@router.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    n = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if n:
        n.is_read = True
        db.commit()
    return {"message": "Notification marked as read"}
