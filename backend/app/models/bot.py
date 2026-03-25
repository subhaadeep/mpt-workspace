from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Bot(Base):
    __tablename__ = "bots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    tags = Column(String(500), nullable=True)          # comma-separated tags
    priority = Column(Integer, default=0)              # lower = higher importance (rank)
    status = Column(String(50), default="active")      # active | archived | experimental
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    versions = relationship("BotVersion", back_populates="bot", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])
