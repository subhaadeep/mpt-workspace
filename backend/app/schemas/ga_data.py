from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class GADataCreate(BaseModel):
    run_name: Optional[str] = None
    parameter_sets: Optional[Any] = None
    optimization_results: Optional[Any] = None
    best_chromosomes: Optional[Any] = None
    notes: Optional[str] = None


class GADataOut(GADataCreate):
    id: int
    version_id: int
    created_at: datetime

    class Config:
        from_attributes = True
