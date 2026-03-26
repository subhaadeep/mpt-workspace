from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Bot(Base):
    __tablename__ = "bots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    tags = Column(String(500), nullable=True)
    priority = Column(Integer, default=0)
    status = Column(String(50), default="active")          # active | archived | experimental
    # Trading account info
    account_type = Column(String(20), nullable=True)       # "real" | "demo"
    account_broker = Column(String(100), nullable=True)    # e.g. Exness, Blueberry
    broker_server = Column(String(100), nullable=True)     # e.g. Exness-Real5, Blueberry-Demo2
    account_id = Column(String(200), nullable=True)        # account/client ID
    account_password = Column(String(200), nullable=True)  # encrypted/plain account password
    account_balance = Column(String(50), nullable=True)    # e.g. "50000"
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    versions = relationship("BotVersion", back_populates="bot", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])
