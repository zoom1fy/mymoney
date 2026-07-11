#!/bin/sh
set -e

echo "Running Prisma generate..."
npx prisma generate

MIGRATION_NAME=$(ls prisma/migrations/ | grep -v migration_lock | sort | tail -1)

echo "Trying prisma migrate deploy..."
if npx prisma migrate deploy; then
  echo "Migrations applied successfully ($MIGRATION_NAME)"
else
  echo "Migration history not found, using db push..."
  npx prisma db push --accept-data-loss
  echo "Resolving migration as applied..."
  npx prisma migrate resolve --applied "$MIGRATION_NAME"
  echo "Migration resolved: $MIGRATION_NAME"
fi

echo "Running seed..."
npm run prisma:seed

echo "Starting application..."
exec "$@"
