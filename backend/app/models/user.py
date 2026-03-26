from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.db.base import Base

SUPER_ADMIN_USERNAME = "subhadeep"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    plain_password = Column(String, nullable=True)  # stored for super admin view only
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    is_super_admin = Column(Boolean, default=False)
    can_access_bots = Column(Boolean, default=False)
    can_access_youtube = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
