from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum


class VideoStatus(str, enum.Enum):
    script = "script"
    raw_files = "raw_files"
    editing = "editing"
    thumbnail = "thumbnail"
    uploaded = "uploaded"


class YouTubeVideo(Base):
    __tablename__ = "youtube_videos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    idea_description = Column(Text, nullable=True)
    script = Column(Text, nullable=True)
    status = Column(Enum(VideoStatus), default=VideoStatus.script)
    youtube_url = Column(String(500), nullable=True)
    tags = Column(String(500), nullable=True)
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    uploaded_date = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", foreign_keys=[created_by])
