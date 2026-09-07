from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.group import Group, GroupMember
from app.models.user import User
from app.schemas.group import GroupCreate, GroupJoin, GroupUpdate
from app.utils.code_generator import generate_group_code

class GroupService:
    @staticmethod
    def create_group(db: Session, group_in: GroupCreate, user_id: str) -> Group:
        # Generate unique code
        code = generate_group_code()
        while db.query(Group).filter(Group.code == code).first():
            code = generate_group_code()

        group = Group(
            name=group_in.name.strip(),
            code=code,
            owner_id=user_id
        )
        db.add(group)
        db.flush()

        # Add creator as OWNER member
        member = GroupMember(
            group_id=group.id,
            user_id=user_id,
            role="OWNER"
        )
        db.add(member)
        db.commit()
        db.refresh(group)
        return group

    @staticmethod
    def join_group(db: Session, join_in: GroupJoin, user_id: str) -> Group:
        code_upper = join_in.code.strip().upper()
        group = db.query(Group).filter(Group.code == code_upper, Group.deleted_at.is_(None)).first()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid group code or group does not exist"
            )

        # Check existing membership
        existing_member = db.query(GroupMember).filter(
            GroupMember.group_id == group.id,
            GroupMember.user_id == user_id
        ).first()
        if existing_member:
            return group  # Already a member

        # Strict MVP rule: MAX 2 ACTIVE MEMBERS PER GROUP!
        current_member_count = db.query(GroupMember).filter(GroupMember.group_id == group.id).count()
        if current_member_count >= 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This group already has two members."
            )

        # Add user as MEMBER
        new_member = GroupMember(
            group_id=group.id,
            user_id=user_id,
            role="MEMBER"
        )
        db.add(new_member)
        db.commit()
        db.refresh(group)
        return group

    @staticmethod
    def get_group_by_id(db: Session, group_id: str, user_id: str) -> Group:
        # Ensure user belongs to group
        member = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id
        ).first()
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You are not a member of this group."
            )
        
        group = db.query(Group).filter(Group.id == group_id, Group.deleted_at.is_(None)).first()
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        return group

    @staticmethod
    def list_user_groups(db: Session, user_id: str) -> list[Group]:
        memberships = db.query(GroupMember).filter(GroupMember.user_id == user_id).all()
        group_ids = [m.group_id for m in memberships]
        return db.query(Group).filter(
            Group.id.in_(group_ids),
            Group.deleted_at.is_(None)
        ).all()

    @staticmethod
    def update_group(db: Session, group_id: str, group_in: GroupUpdate, user_id: str) -> Group:
        group = GroupService.get_group_by_id(db, group_id, user_id)
        if group.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the group owner can update group details"
            )
        group.name = group_in.name.strip()
        db.commit()
        db.refresh(group)
        return group

    @staticmethod
    def remove_member(db: Session, group_id: str, member_user_id: str, requesting_user_id: str) -> bool:
        group = GroupService.get_group_by_id(db, group_id, requesting_user_id)
        if group.owner_id != requesting_user_id and member_user_id != requesting_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only group owner or the member themselves can remove membership"
            )

        member = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == member_user_id
        ).first()
        if not member:
            raise HTTPException(status_code=404, detail="Member not found in group")

        db.delete(member)
        db.commit()
        return True

    @staticmethod
    def delete_group(db: Session, group_id: str, user_id: str) -> bool:
        group = GroupService.get_group_by_id(db, group_id, user_id)
        if group.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the group owner can delete this group"
            )
        db.delete(group)
        db.commit()
        return True
