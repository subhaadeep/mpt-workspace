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
    is_admin: Optional[bool] = None


class SubAdminCreate(BaseModel):
    user_id: int
    can_manage_users: bool = False
    can_manage_bots: bool = False
    can_manage_youtube: bool = False
    can_view_logs: bool = False


class SubAdminUpdate(BaseModel):
    can_manage_users: Optional[bool] = None
    can_manage_bots: Optional[bool] = None
    can_manage_youtube: Optional[bool] = None
    can_view_logs: Optional[bool] = None


class TransferSuperAdmin(BaseModel):
    new_super_admin_id: int


class UserOut(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    is_super_admin: bool
    is_sub_admin: bool = False
    can_manage_users: bool = False
    can_manage_bots: bool = False
    can_manage_youtube: bool = False
    can_view_logs: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class UserWithPassword(UserOut):
    plain_password: Optional[str] = None


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
