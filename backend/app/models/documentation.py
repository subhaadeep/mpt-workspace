from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Documentation(Base):
    __tablename__ = "documentation"

    id = Column(Integer, primary_key=True, index=True)
    version_id = Column(Integer, ForeignKey("bot_versions.id"), nullable=False, unique=True)
    strategy_overview = Column(Text, nullable=True)
    logic_breakdown = Column(Text, nullable=True)
    entry_rules = Column(Text, nullable=True)
    exit_rules = Column(Text, nullable=True)
    additional_notes = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    version = relationship("BotVersion", back_populates="documentation")
