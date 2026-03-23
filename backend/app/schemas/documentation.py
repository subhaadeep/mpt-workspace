from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocCreate(BaseModel):
    strategy_overview: Optional[str] = None
    logic_breakdown: Optional[str] = None
    entry_rules: Optional[str] = None
    exit_rules: Optional[str] = None
    additional_notes: Optional[str] = None


class DocOut(DocCreate):
    id: int
    version_id: int
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
