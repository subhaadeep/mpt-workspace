"""Run once on startup to ensure subhadeep is always super admin."""
from sqlalchemy.orm import Session
from app.models.user import User, SUPER_ADMIN_USERNAME


def seed_super_admin(db: Session) -> None:
    """Ensure the super admin user has is_super_admin=True and is_admin=True."""
    user = db.query(User).filter(User.username == SUPER_ADMIN_USERNAME).first()
    if user:
        if not user.is_super_admin or not user.is_admin:
            user.is_super_admin = True
            user.is_admin = True
            db.commit()
