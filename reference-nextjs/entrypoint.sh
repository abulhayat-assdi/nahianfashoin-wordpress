#!/bin/sh
set -e

# Ensure uploads directory exists (volume may be empty on first run)
mkdir -p /app/public/uploads

# Restore site logo uploaded via admin panel (survives container rebuilds)
if [ -f "/app/public/uploads/site-logo.png" ]; then
  cp "/app/public/uploads/site-logo.png" "/app/public/logo.png"
elif [ -f "/app/.uploads-seed/site-logo.png" ]; then
  cp "/app/.uploads-seed/site-logo.png" "/app/public/uploads/site-logo.png"
  cp "/app/.uploads-seed/site-logo.png" "/app/public/logo.png"
fi

# Wait for PostgreSQL to be ready
echo "Waiting for database..."
DB_HOST=$(echo "$DATABASE_URL" | sed 's|.*@||' | cut -d: -f1)
DB_PORT=$(echo "$DATABASE_URL" | sed 's|.*@||' | cut -d: -f2 | cut -d/ -f1)
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  sleep 1
done
echo "Database is ready."

# Apply schema migrations
echo "Running database migrations..."
i=0
until node node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss 2>/dev/null; do
  i=$((i + 1))
  if [ $i -ge 10 ]; then
    echo "Migration failed after 10 attempts, aborting."
    exit 1
  fi
  echo "Migration attempt $i failed, retrying in 3s..."
  sleep 3
done
echo "Migrations complete."

echo "Starting Next.js..."
exec node server.js
