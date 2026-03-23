from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class PerformanceCreate(BaseModel):
    profit_loss: Optional[float] = None
    drawdown: Optional[float] = None
    win_rate: Optional[float] = None
    trade_count: Optional[int] = None
    custom_metrics: Optional[Dict[str, Any]] = None


class PerformanceOut(PerformanceCreate):
    id: int
    version_id: int
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
