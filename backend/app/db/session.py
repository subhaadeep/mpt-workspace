from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Force TCP connection (not Unix socket) and SSL for Supabase
db_url = settings.DATABASE_URL

# Ensure sslmode=require is present so psycopg2 uses TCP, not a Unix socket
if "sslmode" not in db_url:
    db_url = db_url + ("&" if "?" in db_url else "?") + "sslmode=require"

engine = create_engine(
    db_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args={"sslmode": "require"},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
