from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func, JSON, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum


class TestType(str, enum.Enum):
    backtest = "backtest"
    live = "live"
    paper = "paper"


class TestData(Base):
    __tablename__ = "test_data"

    id = Column(Integer, primary_key=True, index=True)
    version_id = Column(Integer, ForeignKey("bot_versions.id"), nullable=False)
    test_type = Column(Enum(TestType), default=TestType.backtest)
    test_name = Column(String(200), nullable=True)
    results = Column(JSON, nullable=True)
    logs = Column(Text, nullable=True)  # Python execution logs
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    version = relationship("BotVersion", back_populates="test_data")
