# Import all models here so SQLAlchemy create_all / Alembic can discover them.
# This file must NOT be imported by any model — only by main.py and migrations.
from app.models.user import User  # noqa
from app.models.access_request import AccessRequest  # noqa
from app.models.bot import Bot  # noqa
from app.models.bot_version import BotVersion  # noqa
from app.models.youtube import YouTubeVideo  # noqa
from app.models.youtube_activity import YouTubeActivity  # noqa
from app.models.deleted_video import DeletedVideo  # noqa
