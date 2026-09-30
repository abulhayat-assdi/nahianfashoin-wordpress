#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Nahian Fashion — Emergency Restore Script
#  Restores database + uploads from a backup file
#
#  Usage:
#    ./restore.sh --db   /var/backups/nahian-fashion/db/nahian-fashion_2026-05-16_02-00-00.sql.gz
#    ./restore.sh --uploads /var/backups/nahian-fashion/uploads/nahian-fashion_2026-05-16_02-00-00_uploads.tar.gz
#    ./restore.sh --all  (restores latest backup automatically)
# ─────────────────────────────────────────────────────────────

set -euo pipefail

BACKUP_DIR="/var/backups/nahian-fashion"
UPLOADS_DIR="/var/www/nahian-fashion/uploads"
DB_CONTAINER="nahian-fashion-db"
DB_NAME="postgres"
DB_USER="postgres"

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING: $1${NC}"; }
fail() { echo -e "${RED}[$(date '+%H:%M:%S')] ERROR: $1${NC}"; exit 1; }

restore_db() {
    local backup_file="$1"
    [ -f "${backup_file}" ] || fail "Backup file not found: ${backup_file}"

    log "Restoring database from: ${backup_file}"
    log "WARNING: This will REPLACE the current database!"
    read -rp "Are you sure? (yes/no): " confirm
    [ "${confirm}" = "yes" ] || fail "Restore cancelled."

    log "Dropping and recreating database..."
    docker exec "${DB_CONTAINER}" \
        psql -U "${DB_USER}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

    log "Restoring data..."
    zcat "${backup_file}" | docker exec -i "${DB_CONTAINER}" \
        psql -U "${DB_USER}" -d "${DB_NAME}" -q

    log "Database restore complete!"
}

restore_uploads() {
    local backup_file="$1"
    [ -f "${backup_file}" ] || fail "Backup file not found: ${backup_file}"

    log "Restoring uploads from: ${backup_file}"
    mkdir -p "$(dirname "${UPLOADS_DIR}")"
    tar -xzf "${backup_file}" -C "$(dirname "${UPLOADS_DIR}")"
    log "Uploads restore complete!"
}

restore_latest() {
    log "Finding latest backups..."
    local latest_db
    local latest_uploads
    latest_db=$(ls -t "${BACKUP_DIR}/db/"*.sql.gz 2>/dev/null | head -1)
    latest_uploads=$(ls -t "${BACKUP_DIR}/uploads/"*.tar.gz 2>/dev/null | head -1)

    [ -n "${latest_db}" ] || fail "No database backups found in ${BACKUP_DIR}/db/"

    log "Latest DB backup:      ${latest_db}"
    log "Latest uploads backup: ${latest_uploads:-none}"

    restore_db "${latest_db}"
    [ -n "${latest_uploads}" ] && restore_uploads "${latest_uploads}"
}

case "${1:-}" in
    --db)      restore_db "${2:-}" ;;
    --uploads) restore_uploads "${2:-}" ;;
    --all)     restore_latest ;;
    *)
        echo "Usage:"
        echo "  $0 --all                        # restore latest backup"
        echo "  $0 --db      <backup.sql.gz>    # restore specific DB backup"
        echo "  $0 --uploads <backup.tar.gz>    # restore specific uploads backup"
        exit 1 ;;
esac
