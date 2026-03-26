from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


def init_db():
    db: Session = SessionLocal()
    try:
        # Remove any leftover old-format admin (email as username)
        old = db.query(User).filter(User.username.contains('@')).first()
        if old:
            logger.info(f"[init_db] Removing old email-based user: {old.username}")
            db.delete(old)
            db.commit()

        # Upsert the correct admin
        admin = db.query(User).filter(User.username == settings.FIRST_ADMIN_USERNAME).first()
        if not admin:
            admin = User(
                username=settings.FIRST_ADMIN_USERNAME,
                hashed_password=get_password_hash(settings.FIRST_ADMIN_PASSWORD),
                full_name="Admin",
                is_admin=True,
                is_active=True,
                can_access_bots=True,
                can_access_youtube=True,
            )
            db.add(admin)
            db.commit()
            logger.info(f"[init_db] Created admin: {settings.FIRST_ADMIN_USERNAME}")
        else:
            # Always reset password to make sure it's correct
            admin.hashed_password = get_password_hash(settings.FIRST_ADMIN_PASSWORD)
            admin.is_admin = True
            admin.is_active = True
            admin.can_access_bots = True
            admin.can_access_youtube = True
            db.commit()
            logger.info(f"[init_db] Admin refreshed: {settings.FIRST_ADMIN_USERNAME}")
    finally:
        db.close()
