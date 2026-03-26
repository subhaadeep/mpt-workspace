from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ChannelCreate(BaseModel):
    name: str
    description: Optional[str] = None
    youtube_handle: Optional[str] = None


class ChannelOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    youtube_handle: Optional[str]
    created_by: int
    created_at: datetime

    model_config = {"from_attributes": True}
