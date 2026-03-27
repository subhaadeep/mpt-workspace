from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BotCreate(BaseModel):
    name: str
    description: Optional[str] = None
    tags: Optional[str] = None
    priority: Optional[int] = 0
    status: Optional[str] = "active"
    account_type: Optional[str] = None
    account_broker: Optional[str] = None
    broker_server: Optional[str] = None
    account_id: Optional[str] = None
    account_password: Optional[str] = None
    account_balance: Optional[str] = None


class BotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    priority: Optional[int] = None
    status: Optional[str] = None
    account_type: Optional[str] = None
    account_broker: Optional[str] = None
    broker_server: Optional[str] = None
    account_id: Optional[str] = None
    account_password: Optional[str] = None
    account_balance: Optional[str] = None


class BotOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    tags: Optional[str] = None
    priority: int = 0
    status: str = "active"
    account_type: Optional[str] = None
    account_broker: Optional[str] = None
    broker_server: Optional[str] = None
    account_id: Optional[str] = None
    account_password: Optional[str] = None
    account_balance: Optional[str] = None
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
