from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from app.core.config import settings


def init_db():
    """Create default admin user if none exists."""
    db: Session = SessionLocal()
    try:
        admin = db.query(User).filter(User.is_admin == True).first()
        if not admin:
            admin_user = User(
                email=settings.FIRST_ADMIN_EMAIL,
                hashed_password=get_password_hash(settings.FIRST_ADMIN_PASSWORD),
                full_name="Admin",
                is_admin=True,
                is_active=True,
                can_access_bots=True,
                can_access_youtube=True,
            )
            db.add(admin_user)
            db.commit()
            print(f"[INIT] Admin user created: {settings.FIRST_ADMIN_EMAIL}")
    finally:
        db.close()
