from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class BotActivityOut(BaseModel):
    id: int
    bot_id: Optional[int] = None
    bot_name: Optional[str] = None
    action: str
    detail: Optional[str] = None
    done_by_id: Optional[int] = None
    done_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
