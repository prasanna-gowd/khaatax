from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email_or_phone: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)

class UserLogin(BaseModel):
    email_or_phone: str
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email_or_phone: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenData(BaseModel):
    user_id: str | None = None
