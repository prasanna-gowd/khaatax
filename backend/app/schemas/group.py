from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.auth import UserOut

class GroupCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)

class GroupJoin(BaseModel):
    code: str = Field(..., min_length=4, max_length=10)

class GroupUpdate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)

class GroupMemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    role: str
    joined_at: datetime
    user: UserOut

class GroupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    code: str
    owner_id: str
    created_at: datetime
    members: list[GroupMemberOut] = []
