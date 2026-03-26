#!/bin/sh
set -e
pip install -r requirements.txt

# Run DB migration: drop old tables and recreate with new schema
python -c "
from app.db.session import engine
from app.db.base import Base
from app.db.init_db import init_db
print('[start.sh] Dropping all tables...')
Base.metadata.drop_all(bind=engine)
print('[start.sh] Recreating all tables...')
Base.metadata.create_all(bind=engine)
print('[start.sh] Seeding admin user...')
init_db()
print('[start.sh] Done!')
"

exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
