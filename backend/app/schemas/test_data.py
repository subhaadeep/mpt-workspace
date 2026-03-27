from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class TestDataCreate(BaseModel):
    test_name: Optional[str] = None
    result: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class TestDataOut(TestDataCreate):
    id: int
    version_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
