from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine
from app.db.base import Base

# Import all models so Base knows about them before create_all
from app.models import user, access_request, youtube_channel, youtube, youtube_activity, deleted_video, bot, bot_version, code_storage, performance, test_data, ga_data, documentation, upload  # noqa: F401

from app.api import auth, admin, users, bots, bot_versions, youtube as youtube_router, youtube_channels, files

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MPT Workspace API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(bots.router, prefix="/api/bots", tags=["bots"])
app.include_router(bot_versions.router, prefix="/api/bots", tags=["bot-versions"])
app.include_router(youtube_router.router, prefix="/api/youtube", tags=["youtube"])
app.include_router(youtube_channels.router, prefix="/api/youtube/channels", tags=["youtube-channels"])
app.include_router(files.router, prefix="/api/files", tags=["files"])


@app.get("/health")
def health():
    return {"status": "ok"}
