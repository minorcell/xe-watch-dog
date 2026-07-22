#!/bin/sh
set -e

echo "Running database schema..."
# Try to apply schema — non-blocking if tables already exist
PGPASSWORD="${DB_PASSWORD:-watchdog}" psql -h "${DB_HOST:-db}" -U "${DB_USER:-watchdog}" -d "${DB_NAME:-watchdog}" -f database/001_schema.sql 2>/dev/null || true

echo "Starting Watchdog..."
exec "$@"
