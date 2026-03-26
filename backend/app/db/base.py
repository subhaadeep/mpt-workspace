from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

# Import all models here so Alembic / create_all picks them up
from app.models.user import User  # noqa
from app.models.access_request import AccessRequest  # noqa
