from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, admin, bots, bot_versions, files, youtube, users
from app.db.session import SessionLocal
from app.db.seed_super_admin import seed_super_admin
import app.db.all_models  # noqa — ensures all models are registered with SQLAlchemy

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


@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed_super_admin(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}
