from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum


class DeletedVideo(Base):
    __tablename__ = "deleted_videos"

    id = Column(Integer, primary_key=True, index=True)
    original_id = Column(Integer, nullable=True)          # original youtube_videos.id
    title = Column(String(300), nullable=False)
    idea_description = Column(Text, nullable=True)
    script = Column(Text, nullable=True)
    status_at_deletion = Column(String(50), nullable=True)
    youtube_url = Column(String(500), nullable=True)
    tags = Column(String(500), nullable=True)
    deleted_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    deleted_at = Column(DateTime(timezone=True), server_default=func.now())

    deleted_by = relationship("User", foreign_keys=[deleted_by_id])
