from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base


class BotVersion(Base):
    __tablename__ = "bot_versions"

    id = Column(Integer, primary_key=True, index=True)
    bot_id = Column(Integer, ForeignKey("bots.id"), nullable=False)
    version_name = Column(String(50), nullable=False)         # v1.0, v2.1, etc.
    notes = Column(Text, nullable=True)                       # general notes
    changes_description = Column(Text, nullable=True)         # what changed from prev version

    # Structured version details
    implemented_features = Column(JSON, nullable=True)        # list of strings
    planned_changes = Column(JSON, nullable=True)             # list of strings
    inputs = Column(JSON, nullable=True)                      # list of {name, type, value, description}
    screenshots = Column(JSON, nullable=True)                 # list of {title, gdrive_url, description}
    extra_sections = Column(JSON, nullable=True)              # list of {title, content} - freeform

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    bot = relationship("Bot", back_populates="versions")
    performance = relationship("PerformanceData", back_populates="version", uselist=False, cascade="all, delete-orphan")
    ga_runs = relationship("GAData", back_populates="version", cascade="all, delete-orphan")
    test_data = relationship("TestData", back_populates="version", cascade="all, delete-orphan")
    code_storage = relationship("CodeStorage", back_populates="version", cascade="all, delete-orphan")
    documentation = relationship("Documentation", back_populates="version", uselist=False, cascade="all, delete-orphan")
    uploaded_files = relationship("UploadedFile", back_populates="version", cascade="all, delete-orphan")
