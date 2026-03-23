from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class BotCreate(BaseModel):
    name: str
    description: Optional[str] = None
    tags: Optional[str] = None


class BotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None


class BotOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    tags: Optional[str]
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
