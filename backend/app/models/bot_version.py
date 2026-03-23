from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.base import Base


class BotVersion(Base):
    __tablename__ = "bot_versions"

    id = Column(Integer, primary_key=True, index=True)
    bot_id = Column(Integer, ForeignKey("bots.id"), nullable=False)
    version_name = Column(String(50), nullable=False)  # v1, v2, etc.
    notes = Column(Text, nullable=True)
    changes_description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    bot = relationship("Bot", back_populates="versions")
    performance = relationship("PerformanceData", back_populates="version", uselist=False, cascade="all, delete-orphan")
    ga_runs = relationship("GAData", back_populates="version", cascade="all, delete-orphan")
    test_data = relationship("TestData", back_populates="version", cascade="all, delete-orphan")
    code_storage = relationship("CodeStorage", back_populates="version", cascade="all, delete-orphan")
    documentation = relationship("Documentation", back_populates="version", uselist=False, cascade="all, delete-orphan")
    uploaded_files = relationship("UploadedFile", back_populates="version", cascade="all, delete-orphan")
