#!/usr/bin/env sh
set -e

BACKUP_DIR=${BACKUP_DIR:-/backups}
mkdir -p "$BACKUP_DIR"

ts=$(date +%F_%H%M%S)
out="$BACKUP_DIR/backup-$ts.sql.gz"

echo "[$(date +"%F %T")] Starting backup → $out"

pg_dump \
  --host="$PGHOST" \
  --port="$PGPORT" \
  --username="$PGUSER" \
  --dbname="$PGDATABASE" \
  --format=plain | gzip > "$out"

echo "[$(date +"%F %T")] Backup completed"

# Cleanup old backups
echo "[$(date +"%F %T")] Removing backups older than 7 days"
find "$BACKUP_DIR" -type f -name "backup-*.sql.gz" -mtime +7 -print -delete
