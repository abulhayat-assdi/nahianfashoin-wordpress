#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Nahian Fashion — Automated Backup Script
#  Backs up: PostgreSQL database + uploaded images
#  Run via cron: 0 2 * * * /opt/nahian-fashion/scripts/backup.sh
# ─────────────────────────────────────────────────────────────

set -euo pipefail

# ── Configuration ────────────────────────────────────────────
BACKUP_DIR="/var/backups/nahian-fashion"
UPLOADS_DIR="/var/www/nahian-fashion/uploads"
DB_CONTAINER="nahian-fashion-db"          # docker-compose container name
DB_NAME="postgres"
DB_USER="postgres"
KEEP_DAYS=14                            # keep last 14 days of backups
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="nahian-fashion_${TIMESTAMP}"

# ── Colors for output ────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING: $1${NC}"; }
fail() { echo -e "${RED}[$(date '+%H:%M:%S')] ERROR: $1${NC}"; exit 1; }

# ── Create backup directory ──────────────────────────────────
mkdir -p "${BACKUP_DIR}/db"
mkdir -p "${BACKUP_DIR}/uploads"

log "Starting backup: ${BACKUP_NAME}"

# ── 1. Database backup via pg_dump ───────────────────────────
log "Backing up PostgreSQL database..."

DB_BACKUP="${BACKUP_DIR}/db/${BACKUP_NAME}.sql.gz"

if docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    docker exec "${DB_CONTAINER}" \
        pg_dump -U "${DB_USER}" -d "${DB_NAME}" --no-password \
        | gzip > "${DB_BACKUP}"
    log "Database backup saved: ${DB_BACKUP} ($(du -sh "${DB_BACKUP}" | cut -f1))"
else
    # Fallback: try direct pg_dump using DATABASE_URL from env file
    if [ -f "/opt/nahian-fashion/.env.production" ]; then
        source /opt/nahian-fashion/.env.production
        pg_dump "${DATABASE_URL}" | gzip > "${DB_BACKUP}"
        log "Database backup saved via direct connection: ${DB_BACKUP}"
    else
        fail "Cannot find DB container '${DB_CONTAINER}' and no .env.production found"
    fi
fi

# ── 2. Uploads backup ────────────────────────────────────────
log "Backing up uploaded images..."

UPLOADS_BACKUP="${BACKUP_DIR}/uploads/${BACKUP_NAME}_uploads.tar.gz"

if [ -d "${UPLOADS_DIR}" ]; then
    tar -czf "${UPLOADS_BACKUP}" -C "$(dirname "${UPLOADS_DIR}")" "$(basename "${UPLOADS_DIR}")"
    log "Uploads backup saved: ${UPLOADS_BACKUP} ($(du -sh "${UPLOADS_BACKUP}" | cut -f1))"
else
    warn "Uploads directory not found at ${UPLOADS_DIR} — skipping"
fi

# ── 3. Remove old backups (older than KEEP_DAYS) ─────────────
log "Removing backups older than ${KEEP_DAYS} days..."
find "${BACKUP_DIR}/db"      -name "*.sql.gz"      -mtime +${KEEP_DAYS} -delete
find "${BACKUP_DIR}/uploads" -name "*.tar.gz"      -mtime +${KEEP_DAYS} -delete

# ── 4. Summary ───────────────────────────────────────────────
log "──────────────────────────────────────────"
log "Backup complete!"
log "DB backup:      ${DB_BACKUP}"
log "Uploads backup: ${UPLOADS_BACKUP}"
log "Stored backups:"
ls -lh "${BACKUP_DIR}/db/" | tail -5
log "──────────────────────────────────────────"
