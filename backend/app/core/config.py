from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://mpt_user:mpt_secret@localhost:5432/mpt_db"
    SECRET_KEY: str = "changeme_super_secret_key_32chars_minimum"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    FIRST_ADMIN_EMAIL: str = "admin@mpt.local"
    FIRST_ADMIN_PASSWORD: str = "Admin@123"
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    class Config:
        env_file = ".env"


settings = Settings()
