from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func, BigInteger
from sqlalchemy.orm import relationship
from app.db.base import Base


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    version_id = Column(Integer, ForeignKey("bot_versions.id"), nullable=True)
    original_filename = Column(String(300), nullable=False)
    stored_filename = Column(String(300), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=True)
    mime_type = Column(String(100), nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    version = relationship("BotVersion", back_populates="uploaded_files")
    uploader = relationship("User", foreign_keys=[uploaded_by])
