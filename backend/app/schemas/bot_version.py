from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class VersionCreate(BaseModel):
    version_name: str
    notes: Optional[str] = None
    changes_description: Optional[str] = None


class VersionUpdate(BaseModel):
    version_name: Optional[str] = None
    notes: Optional[str] = None
    changes_description: Optional[str] = None


class VersionOut(BaseModel):
    id: int
    bot_id: int
    version_name: str
    notes: Optional[str]
    changes_description: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
