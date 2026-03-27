from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocCreate(BaseModel):
    content: Optional[str] = None


class DocOut(BaseModel):
    id: int
    version_id: Optional[int] = None
    content: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
