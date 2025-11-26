#!/bin/sh

# Database backup script
# Keeps backups for the last 7 days

BACKUP_DIR="/backups"
DB_NAME="${PGDATABASE:-cortexex}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql"

# Create backup
echo "Creating backup: ${BACKUP_FILE}"
pg_dump -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${DB_NAME}" > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "Backup created successfully: ${BACKUP_FILE}"
    
    # Compress backup
    gzip "${BACKUP_FILE}"
    echo "Backup compressed: ${BACKUP_FILE}.gz"
    
    # Remove backups older than 7 days
    echo "Cleaning up old backups (keeping last 7 days)..."
    find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -type f -mtime +7 -delete
    echo "Cleanup completed"
else
    echo "Backup failed!"
    exit 1
fi

