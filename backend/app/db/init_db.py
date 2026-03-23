from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from app.core.config import settings


def init_db():
    db: Session = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == settings.FIRST_ADMIN_EMAIL).first()
        if not existing:
            admin = User(
                email=settings.FIRST_ADMIN_EMAIL,
                hashed_password=get_password_hash(settings.FIRST_ADMIN_PASSWORD),
                full_name="Admin",
                role="admin",
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print(f"[init_db] Created default admin: {settings.FIRST_ADMIN_EMAIL}")
        else:
            print("[init_db] Admin already exists, skipping.")
    finally:
        db.close()
