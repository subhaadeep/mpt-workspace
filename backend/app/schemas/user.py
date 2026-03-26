from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    can_access_bots: bool = False
    can_access_youtube: bool = False


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    can_access_bots: Optional[bool] = None
    can_access_youtube: Optional[bool] = None
    is_active: Optional[bool] = None


class UserOut(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AccessRequestCreate(BaseModel):
    username: str
    full_name: str
    password: str


class AccessRequestOut(BaseModel):
    id: int
    username: str
    full_name: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
