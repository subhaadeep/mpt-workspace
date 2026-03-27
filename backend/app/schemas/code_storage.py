from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CodeCreate(BaseModel):
    language: Optional[str] = None
    filename: Optional[str] = None
    code_content: Optional[str] = None
    description: Optional[str] = None


class CodeUpdate(BaseModel):
    language: Optional[str] = None
    filename: Optional[str] = None
    code_content: Optional[str] = None
    description: Optional[str] = None


class CodeOut(BaseModel):
    id: int
    version_id: Optional[int] = None
    language: Optional[str] = None
    filename: Optional[str] = None
    code_content: Optional[str] = None
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
