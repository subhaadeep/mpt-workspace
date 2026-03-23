from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base


class PerformanceData(Base):
    __tablename__ = "performance_data"

    id = Column(Integer, primary_key=True, index=True)
    version_id = Column(Integer, ForeignKey("bot_versions.id"), nullable=False, unique=True)
    profit_loss = Column(Float, nullable=True)
    drawdown = Column(Float, nullable=True)  # percentage
    win_rate = Column(Float, nullable=True)  # percentage
    trade_count = Column(Integer, nullable=True)
    custom_metrics = Column(JSON, nullable=True)  # extensible key-value store
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    version = relationship("BotVersion", back_populates="performance")
