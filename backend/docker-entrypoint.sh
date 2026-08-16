#!/bin/sh
set -e

echo "Waiting for Redis..."
REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}
while ! nc -z "$REDIS_HOST" "$REDIS_PORT" 2>/dev/null; do
  sleep 1
done
echo "Redis is ready"

echo "Syncing database schema to contract..."
if npm run prisma:migrate; then
  echo "Migrations applied successfully"
else
  echo "No migration path yet, syncing schema directly..."
  npx prisma-next db update
fi

echo "Starting application..."
exec "$@"
