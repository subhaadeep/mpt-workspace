from sqlalchemy import Column, Integer, ForeignKey, DateTime, Boolean, String
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base

class LoginLog(Base):
    __tablename__ = "login_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    logged_in_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    logged_out_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)  # True = still logged in

    user = relationship("User", foreign_keys=[user_id])
