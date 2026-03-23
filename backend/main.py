from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.db.session import engine
from app.db.base import Base
from app.api import auth, users, bots, bot_versions, youtube, admin, files
from app.core.config import settings
from app.db.init_db import init_db

# Create DB tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MPT Workspace API",
    description="Modular Platform for Trading & Content Management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for static file serving
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(bots.router, prefix="/api/bots", tags=["Bots"])
app.include_router(bot_versions.router, prefix="/api/bots", tags=["Bot Versions"])
app.include_router(youtube.router, prefix="/api/youtube", tags=["YouTube"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(files.router, prefix="/api/files", tags=["Files"])


@app.on_event("startup")
async def startup_event():
    init_db()


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "MPT Workspace API"}
