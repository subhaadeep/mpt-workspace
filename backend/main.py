from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import time
import logging

from app.db.session import engine
from app.db.base import Base
from app.api import auth, users, bots, bot_versions, youtube, admin, files
from app.core.config import settings
from app.db.init_db import init_db

logger = logging.getLogger(__name__)

app = FastAPI(
    title="MPT Workspace API",
    description="Modular Platform for Trading & Content Management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Read allowed origins from env, fallback to localhost for dev
raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
)
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for static file serving
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth.router,         prefix="/api/auth",    tags=["Authentication"])
app.include_router(users.router,        prefix="/api/users",   tags=["Users"])
app.include_router(bots.router,         prefix="/api/bots",    tags=["Bots"])
app.include_router(bot_versions.router, prefix="/api/bots",    tags=["Bot Versions"])
app.include_router(youtube.router,      prefix="/api/youtube", tags=["YouTube"])
app.include_router(admin.router,        prefix="/api/admin",   tags=["Admin"])
app.include_router(files.router,        prefix="/api/files",   tags=["Files"])


@app.on_event("startup")
async def startup_event():
    # Retry DB connection up to 10 times (Render DB may take a moment)
    max_retries = 10
    for attempt in range(1, max_retries + 1):
        try:
            Base.metadata.create_all(bind=engine)
            init_db()
            logger.info("Database ready.")
            return
        except Exception as e:
            logger.warning(f"DB not ready (attempt {attempt}/{max_retries}): {e}")
            if attempt == max_retries:
                logger.error("Could not connect to database after retries. Exiting.")
                raise
            time.sleep(3)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "MPT Workspace API"}
