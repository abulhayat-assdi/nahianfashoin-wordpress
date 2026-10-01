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

# Apply schema migrations.
# NEVER pass --accept-data-loss here: destructive schema changes (new required
# columns, type changes) would silently wipe table data on deploy — this already
# erased all existing orders once. If a change requires data loss, the deploy
# fails instead and the migration must be done manually with a backup.
echo "Running database migrations..."
i=0
until node node_modules/prisma/build/index.js db push --skip-generate 2>/dev/null; do
  i=$((i + 1))
  if [ $i -ge 10 ]; then
    echo "Migration failed after 10 attempts, aborting."
    exit 1
  fi
  echo "Migration attempt $i failed, retrying in 3s..."
  sleep 3
done
echo "Migrations complete."

# Convert any UUID-based product slugs to readable name-based slugs
echo "Normalizing product slugs..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function run() {
  const products = await prisma.product.findMany({ select: { id: true, name: true, slug: true } });
  let fixed = 0;
  for (const p of products) {
    if (uuidRe.test(p.slug)) {
      let base = (p.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9ঀ-৿-]+/g, '').replace(/-+/g, '-').replace(/^-|-\$/g, '')) || p.id.slice(0, 8);
      let slug = base, n = 1;
      while (true) {
        try { await prisma.product.update({ where: { id: p.id }, data: { slug } }); fixed++; break; }
        catch(e) { if (e.code === 'P2002') { slug = base + '-' + (++n); } else throw e; }
      }
    }
  }
  if (fixed > 0) console.log('Fixed slugs for ' + fixed + ' product(s).');
  else console.log('All product slugs are already clean.');
  await prisma.\$disconnect();
}
run().catch(function(e) { console.error('Slug normalization error (non-fatal):', e.message); });
" || true

# Sync product categories: if a product's category name doesn't match any active
# category, try to find the closest active category by name similarity and update.
# This fixes stale category names left over from renames done before this cascade was in place.
echo "Syncing product categories..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const categories = await prisma.category.findMany({ select: { name: true } });
  const validNames = new Set(categories.map(function(c) { return c.name; }));
  const lowerMap = {};
  for (const c of categories) lowerMap[c.name.trim().toLowerCase()] = c.name;
  const products = await prisma.product.findMany({ select: { id: true, name: true, category: true } });
  let fixed = 0, skipped = 0;
  for (const p of products) {
    if (!validNames.has(p.category)) {
      // Only re-assign on a safe case/whitespace-insensitive match;
      // otherwise log and leave it for the admin to fix manually.
      const match = lowerMap[(p.category || '').trim().toLowerCase()];
      if (match) {
        await prisma.product.update({ where: { id: p.id }, data: { category: match } });
        fixed++;
      } else {
        console.log('WARN: product \"' + p.name + '\" has unknown category \"' + p.category + '\" — fix it in the admin panel.');
        skipped++;
      }
    }
  }
  if (fixed > 0) console.log('Re-assigned ' + fixed + ' product(s) to valid category.');
  if (skipped > 0) console.log(skipped + ' product(s) left with unknown category.');
  if (fixed === 0 && skipped === 0) console.log('All product categories are valid.');
  await prisma.\$disconnect();
}
run().catch(function(e) { console.error('Category sync error (non-fatal):', e.message); });
" || true

echo "Starting Next.js..."
exec node server.js
