from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CodeCreate(BaseModel):
    label: Optional[str] = None
    language: Optional[str] = None
    code: Optional[str] = None


class CodeUpdate(BaseModel):
    label: Optional[str] = None
    language: Optional[str] = None
    code: Optional[str] = None


class CodeOut(BaseModel):
    id: int
    version_id: Optional[int] = None
    label: Optional[str] = None
    language: Optional[str] = None
    code: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
