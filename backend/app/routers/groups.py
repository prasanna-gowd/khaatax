from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.group import GroupCreate, GroupJoin, GroupUpdate, GroupOut, GroupMemberOut
from app.services.group_service import GroupService
from app.services.balance_service import BalanceService
from app.routers.deps import get_current_user
from app.models.user import User
from app.websocket.manager import manager

router = APIRouter(prefix="/groups", tags=["Groups"])

@router.post("", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
def create_group(
    group_in: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return GroupService.create_group(db, group_in, current_user.id)

@router.post("/join", response_model=GroupOut)
async def join_group(
    join_in: GroupJoin,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = GroupService.join_group(db, join_in, current_user.id)
    await manager.broadcast_to_group(
        group_id=group.id,
        event_type="member_joined",
        data={"user_id": current_user.id, "user_name": current_user.name}
    )
    return group

@router.get("", response_model=list[GroupOut])
def list_my_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return GroupService.list_user_groups(db, current_user.id)

@router.get("/{group_id}", response_model=GroupOut)
def get_group(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return GroupService.get_group_by_id(db, group_id, current_user.id)

@router.put("/{group_id}", response_model=GroupOut)
def update_group(
    group_id: str,
    group_in: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return GroupService.update_group(db, group_id, group_in, current_user.id)

@router.delete("/{group_id}")
def delete_group(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    GroupService.delete_group(db, group_id, current_user.id)
    return {"message": "Group deleted successfully"}

@router.get("/{group_id}/members", response_model=list[GroupMemberOut])
def list_members(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = GroupService.get_group_by_id(db, group_id, current_user.id)
    return group.members

@router.delete("/{group_id}/members/{user_id}")
async def remove_member(
    group_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    GroupService.remove_member(db, group_id, user_id, current_user.id)
    await manager.broadcast_to_group(
        group_id=group_id,
        event_type="member_removed",
        data={"user_id": user_id}
    )
    return {"message": "Member removed successfully"}

@router.get("/{group_id}/balance")
def get_balance(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify group membership first
    GroupService.get_group_by_id(db, group_id, current_user.id)
    return BalanceService.calculate_group_balance(db, group_id, current_user.id)
