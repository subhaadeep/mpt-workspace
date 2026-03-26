from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base

class BotActivity(Base):
    __tablename__ = "bot_activity"

    id = Column(Integer, primary_key=True, index=True)
    bot_id = Column(Integer, ForeignKey("bots.id", ondelete="SET NULL"), nullable=True)
    bot_name = Column(String(200), nullable=True)
    action = Column(String(50), nullable=False)  # created, updated, deleted
    detail = Column(Text, nullable=True)
    done_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    done_by = relationship("User", foreign_keys=[done_by_id])
