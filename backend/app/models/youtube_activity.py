from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func, Text
from sqlalchemy.orm import relationship
from app.db.base import Base


class YouTubeActivity(Base):
    __tablename__ = "youtube_activity"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("youtube_videos.id", ondelete="SET NULL"), nullable=True)
    video_title = Column(String(300), nullable=False)  # snapshot so it survives deletion
    action = Column(String(50), nullable=False)        # "moved", "deleted", "created", "updated"
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=True)
    done_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    done_by = relationship("User", foreign_keys=[done_by_id])
    video = relationship("YouTubeVideo", foreign_keys=[video_id])
