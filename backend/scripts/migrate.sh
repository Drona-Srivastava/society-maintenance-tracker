#!/bin/sh
set -e

echo "Running database migrations..."

if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL is not set"
    exit 1
fi

alembic upgrade head

echo "Database migrations completed successfully."