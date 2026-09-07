#!/usr/bin/env bash
# Render build script — installs deps and runs DB migrations
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

# Run Alembic migrations (creates tables in Supabase PostgreSQL)
# If alembic fails, fall back to create_all (first deploy before alembic history exists)
python -c "
from app.core.database import engine, Base
from app.models import user, group, category, transaction, settlement, notification
Base.metadata.create_all(bind=engine)
print('Tables created successfully via create_all')
"
