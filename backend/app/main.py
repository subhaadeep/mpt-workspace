from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.db.migrate import run_migration
from app.db.seed_super_admin import seed_super_admin

# Import all models so Base knows about them before create_all
from app.models import user, access_request, youtube_channel, youtube, youtube_activity, deleted_video, bot, bot_version, bot_activity, code_storage, performance, test_data, ga_data, documentation, upload, login_log  # noqa: F401

from app.api import auth, auth_register, admin, users, bots, bot_versions, youtube as youtube_router, youtube_channels, files


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Run schema migrations first (adds any missing columns)
    run_migration()
    # 2. Create any tables that still don't exist
    Base.metadata.create_all(bind=engine)
    # 3. Seed super admin (needs plain_password column to exist)
    db = SessionLocal()
    try:
        seed_super_admin(db)
    finally:
        db.close()
    yield


app = FastAPI(title="MPT Workspace API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(auth_register.router, prefix="/api/auth", tags=["auth"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(bots.router, prefix="/api/bots", tags=["bots"])
app.include_router(bot_versions.router, prefix="/api/bot-versions", tags=["bot-versions"])
app.include_router(youtube_router.router, prefix="/api/youtube", tags=["youtube"])
app.include_router(youtube_channels.router, prefix="/api/youtube/channels", tags=["youtube-channels"])
app.include_router(files.router, prefix="/api/files", tags=["files"])


@app.get("/health")
def health():
    return {"status": "ok"}
