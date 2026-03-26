from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class YouTubeActivityOut(BaseModel):
    id: int
    video_id: Optional[int]
    video_title: str
    action: str
    from_status: Optional[str]
    to_status: Optional[str]
    done_by_id: int
    done_by_name: Optional[str] = None
    note: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class DeletedVideoOut(BaseModel):
    id: int
    original_id: Optional[int]
    title: str
    idea_description: Optional[str]
    script: Optional[str]
    status_at_deletion: Optional[str]
    youtube_url: Optional[str]
    tags: Optional[str]
    deleted_by_id: int
    deleted_by_name: Optional[str] = None
    deleted_at: datetime

    model_config = {"from_attributes": True}
