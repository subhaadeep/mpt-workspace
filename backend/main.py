from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, admin, bots, bot_versions, files, youtube, users
from app.db.session import SessionLocal, engine
from app.db.seed_super_admin import seed_super_admin
import app.db.all_models  # noqa — ensures all models are registered with SQLAlchemy
from sqlalchemy import text

app = FastAPI(title="MPT Workspace API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,         prefix="/api/auth",    tags=["auth"])
app.include_router(admin.router,        prefix="/api/admin",   tags=["admin"])
app.include_router(bots.router,         prefix="/api/bots",    tags=["bots"])
app.include_router(bot_versions.router, prefix="/api/bots",    tags=["bot-versions"])
app.include_router(files.router,        prefix="/api/files",   tags=["files"])
app.include_router(youtube.router,      prefix="/api/youtube", tags=["youtube"])
app.include_router(users.router,        prefix="/api/users",   tags=["users"])


def run_migrations():
    """Apply any missing columns/tables/constraints before the app starts.
    Uses AUTOCOMMIT isolation level so every DDL statement commits immediately,
    which is required for ALTER TABLE to actually persist before the ORM query runs.
    """
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:

        # 1. Add plain_password to users if missing
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='users' AND column_name='plain_password'
                ) THEN
                    ALTER TABLE users ADD COLUMN plain_password VARCHAR;
                END IF;
            END$$;
        """))

        # 2. Add is_super_admin to users if missing
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='users' AND column_name='is_super_admin'
                ) THEN
                    ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;
                END IF;
            END$$;
        """))

        # 3. Add can_access_bots to users if missing
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='users' AND column_name='can_access_bots'
                ) THEN
                    ALTER TABLE users ADD COLUMN can_access_bots BOOLEAN DEFAULT FALSE;
                END IF;
            END$$;
        """))

        # 4. Add can_access_youtube to users if missing
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='users' AND column_name='can_access_youtube'
                ) THEN
                    ALTER TABLE users ADD COLUMN can_access_youtube BOOLEAN DEFAULT FALSE;
                END IF;
            END$$;
        """))

        # 5. Create login_logs with CASCADE FK if not exists
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS login_logs (
                id            SERIAL PRIMARY KEY,
                user_id       INTEGER NOT NULL
                                  REFERENCES users(id) ON DELETE CASCADE,
                logged_in_at  TIMESTAMPTZ DEFAULT NOW(),
                logged_out_at TIMESTAMPTZ,
                is_active     BOOLEAN DEFAULT TRUE
            );
        """))

        # 6. Fix existing login_logs FK if it lacks CASCADE
        conn.execute(text("""
            DO $$
            DECLARE
                fk_name TEXT;
            BEGIN
                SELECT tc.constraint_name INTO fk_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.referential_constraints rc
                  ON tc.constraint_name = rc.constraint_name
                WHERE tc.table_name = 'login_logs'
                  AND tc.constraint_type = 'FOREIGN KEY'
                  AND rc.delete_rule <> 'CASCADE'
                LIMIT 1;

                IF fk_name IS NOT NULL THEN
                    EXECUTE 'ALTER TABLE login_logs DROP CONSTRAINT ' || quote_ident(fk_name);
                    ALTER TABLE login_logs
                        ADD CONSTRAINT login_logs_user_id_fkey
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
                END IF;
            END$$;
        """))


@app.on_event("startup")
def on_startup():
    run_migrations()
    db = SessionLocal()
    try:
        seed_super_admin(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}
