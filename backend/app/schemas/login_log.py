from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class LoginLogOut(BaseModel):
    id: int
    user_id: int
    username: str
    full_name: Optional[str] = None
    logged_in_at: datetime
    logged_out_at: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True
