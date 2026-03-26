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
    """Apply any missing columns/constraints before the app starts."""
    with engine.connect() as conn:
        # Add plain_password if missing
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

        # Fix login_logs FK to cascade on delete
        conn.execute(text("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_name = 'login_logs'
                ) THEN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.table_constraints tc
                        JOIN information_schema.constraint_column_usage ccu
                          ON tc.constraint_name = ccu.constraint_name
                        WHERE tc.table_name = 'login_logs'
                          AND tc.constraint_type = 'FOREIGN KEY'
                          AND ccu.table_name = 'users'
                    ) THEN
                        -- Drop old FK without cascade
                        ALTER TABLE login_logs DROP CONSTRAINT IF EXISTS login_logs_user_id_fkey;
                    END IF;
                    -- Re-add with ON DELETE CASCADE
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'login_logs_user_id_fkey'
                          AND contype = 'f'
                    ) THEN
                        ALTER TABLE login_logs
                            ADD CONSTRAINT login_logs_user_id_fkey
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
                    END IF;
                END IF;
            END$$;
        """))

        conn.commit()


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
