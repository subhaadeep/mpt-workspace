from sqlalchemy import text
from app.db.session import engine
from app.db.base import Base
import logging

logger = logging.getLogger(__name__)


def run_migration():
    """Safely migrate schema: handle all column additions and FK fixes."""
    with engine.connect() as conn:

        # ── username column ──────────────────────────────────────────────
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name='users' AND column_name='username'
        """))
        has_username = result.fetchone() is not None

        result2 = conn.execute(text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name='users' AND column_name='email'
        """))
        has_email = result2.fetchone() is not None

        if not has_username and has_email:
            logger.info("[migrate] Renaming email -> username...")
            conn.execute(text("ALTER TABLE users RENAME COLUMN email TO username"))
            conn.commit()
        elif not has_username and not has_email:
            conn.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR UNIQUE"))
            conn.commit()
        else:
            logger.info("[migrate] username column already exists")

        # ── plain_password column ─────────────────────────────────────────
        r = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='plain_password'"))
        if r.fetchone() is None:
            conn.execute(text("ALTER TABLE users ADD COLUMN plain_password VARCHAR"))
            conn.commit()
            logger.info("[migrate] Added plain_password")

        # ── can_access_bots ───────────────────────────────────────────────
        r = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='can_access_bots'"))
        if r.fetchone() is None:
            conn.execute(text("ALTER TABLE users ADD COLUMN can_access_bots BOOLEAN DEFAULT FALSE"))
            conn.commit()

        # ── can_access_youtube ────────────────────────────────────────────
        r = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='can_access_youtube'"))
        if r.fetchone() is None:
            conn.execute(text("ALTER TABLE users ADD COLUMN can_access_youtube BOOLEAN DEFAULT FALSE"))
            conn.commit()

        # ── is_sub_admin ──────────────────────────────────────────────────
        r = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='is_sub_admin'"))
        if r.fetchone() is None:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_sub_admin BOOLEAN DEFAULT FALSE"))
            conn.commit()
            logger.info("[migrate] Added is_sub_admin")

        # ── granular sub-admin permissions ────────────────────────────────
        for col in ['can_manage_users', 'can_manage_bots', 'can_manage_youtube', 'can_view_logs']:
            r = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='{col}'"))
            if r.fetchone() is None:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} BOOLEAN DEFAULT FALSE"))
                conn.commit()
                logger.info(f"[migrate] Added {col}")

        # ── access_requests table ─────────────────────────────────────────
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

        # ── plain_password in access_requests ─────────────────────────────
        r = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='access_requests' AND column_name='plain_password'"))
        if r.fetchone() is None:
            conn.execute(text("ALTER TABLE access_requests ADD COLUMN plain_password VARCHAR"))
            conn.commit()

        # ── login_logs table + ON DELETE CASCADE FK fix ───────────────────
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS login_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                logged_in_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                logged_out_at TIMESTAMP WITH TIME ZONE,
                is_active BOOLEAN DEFAULT TRUE,
                CONSTRAINT fk_login_logs_user
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """))
        conn.commit()

        result7 = conn.execute(text("""
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_name='login_logs' AND constraint_type='FOREIGN KEY'
              AND constraint_name != 'fk_login_logs_user'
        """))
        old_fk = result7.fetchone()
        if old_fk:
            old_fk_name = old_fk[0]
            conn.execute(text(f'ALTER TABLE login_logs DROP CONSTRAINT "{old_fk_name}"'))
            conn.execute(text("""
                ALTER TABLE login_logs ADD CONSTRAINT fk_login_logs_user
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            """))
            conn.commit()
            logger.info("[migrate] Fixed login_logs FK to CASCADE")
