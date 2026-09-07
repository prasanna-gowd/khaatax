from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin
from app.core.security import get_password_hash, verify_password, create_access_token

class AuthService:
    @staticmethod
    def register_user(db: Session, user_in: UserCreate) -> dict:
        # Check if email/phone already exists
        existing_user = db.query(User).filter(User.email_or_phone == user_in.email_or_phone.strip()).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email/phone already exists"
            )
        
        hashed_pw = get_password_hash(user_in.password)
        db_user = User(
            name=user_in.name.strip(),
            email_or_phone=user_in.email_or_phone.strip(),
            hashed_password=hashed_pw
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        access_token = create_access_token(subject=db_user.id)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": db_user
        }

    @staticmethod
    def authenticate_user(db: Session, login_in: UserLogin) -> dict:
        user = db.query(User).filter(User.email_or_phone == login_in.email_or_phone.strip()).first()
        if not user or not verify_password(login_in.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email/phone or password"
            )
        
        access_token = create_access_token(subject=user.id)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }

    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
