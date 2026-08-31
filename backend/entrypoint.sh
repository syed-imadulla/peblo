#!/bin/bash
set -e

# Wait for postgres to be ready
echo "Waiting for postgres..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "db" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "Postgres is up - executing migrations"
alembic upgrade head

echo "Seeding database..."
export PYTHONPATH=.
python app/scripts/seed.py

# Ensure initial catalogue is present in DATA_DIR if not already published
if [ -f "/app/docs/challenge/assets/catalogue.json" ] && [ ! -f "/app/data/catalogue.json" ]; then
  cp /app/docs/challenge/assets/catalogue.json /app/data/ || true
fi

echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
