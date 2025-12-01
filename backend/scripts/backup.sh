#!/bin/sh

# Backup database to /backups inside the container
set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/cortexex_${TIMESTAMP}.sql"

export PGPASSWORD="${PGPASSWORD}"

pg_dump -h "${PGHOST:-db}" -p "${PGPORT:-5432}" -U "${PGUSER:-cortexex}" "${PGDATABASE:-cortexex}" > "${BACKUP_FILE}"

# Remove backups older than 7 days
find "${BACKUP_DIR}" -type f -name "cortexex_*.sql" -mtime +7 -delete
