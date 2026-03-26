from sqlalchemy import text
from app.db.session import engine
from app.db.base import Base
import logging

logger = logging.getLogger(__name__)


def run_migration():
    """Safely migrate schema: add username column, drop email column if needed."""
    with engine.connect() as conn:
        # Check if username column exists
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name='users' AND column_name='username'
        """))
        has_username = result.fetchone() is not None

        # Check if email column exists
        result2 = conn.execute(text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name='users' AND column_name='email'
        """))
        has_email = result2.fetchone() is not None

        if not has_username and has_email:
            logger.info("[migrate] Renaming email -> username...")
            conn.execute(text("ALTER TABLE users RENAME COLUMN email TO username"))
            conn.commit()
            logger.info("[migrate] Done: email renamed to username")
        elif not has_username and not has_email:
            logger.info("[migrate] Adding username column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR UNIQUE"))
            conn.commit()
            logger.info("[migrate] Done: username column added")
        else:
            logger.info("[migrate] username column already exists, skipping")

        # Create access_requests table if not exists
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS access_requests (
                id SERIAL PRIMARY KEY,
                username VARCHAR UNIQUE NOT NULL,
                full_name VARCHAR NOT NULL,
                hashed_password VARCHAR NOT NULL,
                status VARCHAR DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            )
        """))
        conn.commit()
        logger.info("[migrate] access_requests table ready")
