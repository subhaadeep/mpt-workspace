from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BotActivityOut(BaseModel):
    id: int
    bot_id: Optional[int] = None
    bot_name: Optional[str] = None
    action: str
    detail: Optional[str] = None
    done_by_id: Optional[int] = None
    done_by_name: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
