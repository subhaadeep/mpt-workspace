from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
from app.models.test_data import TestType


class TestDataCreate(BaseModel):
    test_type: TestType = TestType.backtest
    test_name: Optional[str] = None
    results: Optional[Any] = None
    logs: Optional[str] = None
    notes: Optional[str] = None


class TestDataOut(TestDataCreate):
    id: int
    version_id: int
    created_at: datetime

    class Config:
        from_attributes = True
