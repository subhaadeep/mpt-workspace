from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.youtube import VideoStatus


class VideoCreate(BaseModel):
    title: str
    idea_description: Optional[str] = None
    script: Optional[str] = None
    status: VideoStatus = VideoStatus.script
    tags: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    youtube_url: Optional[str] = None


class VideoUpdate(BaseModel):
    title: Optional[str] = None
    idea_description: Optional[str] = None
    script: Optional[str] = None
    status: Optional[VideoStatus] = None
    tags: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    uploaded_date: Optional[datetime] = None
    youtube_url: Optional[str] = None


class VideoOut(BaseModel):
    id: int
    title: str
    idea_description: Optional[str]
    script: Optional[str]
    status: VideoStatus
    tags: Optional[str]
    scheduled_date: Optional[datetime]
    uploaded_date: Optional[datetime]
    youtube_url: Optional[str]
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
