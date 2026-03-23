from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base


class GAData(Base):
    __tablename__ = "ga_data"

    id = Column(Integer, primary_key=True, index=True)
    version_id = Column(Integer, ForeignKey("bot_versions.id"), nullable=False)
    run_name = Column(String(200), nullable=True)  # e.g. "Run 1 - Apr 2025"
    parameter_sets = Column(JSON, nullable=True)   # List of parameter dicts
    optimization_results = Column(JSON, nullable=True)
    best_chromosomes = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    version = relationship("BotVersion", back_populates="ga_runs")
