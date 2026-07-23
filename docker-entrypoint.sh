#!/bin/sh
set -e

echo "Running database migrations..."
node scripts/migrate.mjs

echo "Starting Watchdog..."
exec "$@"
