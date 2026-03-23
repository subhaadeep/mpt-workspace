from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum


class CodeLanguage(str, enum.Enum):
    python = "python"
    pinescript = "pinescript"
    mql5 = "mql5"
    other = "other"


class CodeStorage(Base):
    __tablename__ = "code_storage"

    id = Column(Integer, primary_key=True, index=True)
    version_id = Column(Integer, ForeignKey("bot_versions.id"), nullable=False)
    language = Column(Enum(CodeLanguage), default=CodeLanguage.python)
    filename = Column(String(300), nullable=True)
    code_content = Column(Text, nullable=True)  # pasted code
    file_path = Column(String(500), nullable=True)  # uploaded file path
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    version = relationship("BotVersion", back_populates="code_storage")
