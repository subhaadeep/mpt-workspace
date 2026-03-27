from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class GADataCreate(BaseModel):
    generation: Optional[int] = None
    best_fitness: Optional[float] = None
    avg_fitness: Optional[float] = None
    parameters: Optional[Dict[str, Any]] = None


class GADataOut(GADataCreate):
    id: int
    version_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
