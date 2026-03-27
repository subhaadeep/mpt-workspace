"""Run once on startup to ensure subhadeep is always super admin."""
from sqlalchemy.orm import Session
from app.models.user import User, SUPER_ADMIN_USERNAME
from app.core.config import settings


def seed_super_admin(db: Session) -> None:
    """Ensure the super admin user has is_super_admin=True and is_admin=True."""
    user = db.query(User).filter(User.username == SUPER_ADMIN_USERNAME).first()
    if user:
        changed = False
        if not user.is_super_admin:
            user.is_super_admin = True
            changed = True
        if not user.is_admin:
            user.is_admin = True
            changed = True
        if not user.plain_password:
            user.plain_password = settings.FIRST_ADMIN_PASSWORD
            changed = True
        if changed:
            db.commit()
