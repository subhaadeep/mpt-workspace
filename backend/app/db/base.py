from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Import all models here so Alembic and create_all() can detect them
from app.models.user import User  # noqa
from app.models.bot import Bot  # noqa
from app.models.bot_version import BotVersion  # noqa
from app.models.performance import PerformanceData  # noqa
from app.models.ga_data import GAData  # noqa
from app.models.code_storage import CodeStorage  # noqa
from app.models.documentation import Documentation  # noqa
from app.models.test_data import TestData  # noqa
from app.models.upload import UploadedFile  # noqa
from app.models.youtube import YouTubeVideo  # noqa
