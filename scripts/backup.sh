#!/bin/sh

# Database backup script
# Keeps backups for the last 7 days

BACKUP_DIR="../backups"
DB_NAME="${PGDATABASE:-cortexex}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Ensure pg_dump is available
if ! command -v pg_dump >/dev/null 2>&1; then
    echo "pg_dump: command not found. Please install PostgreSQL client tools."
    echo "  Debian/Ubuntu: sudo apt-get update; sudo apt-get install -y postgresql-client"
    echo "  Alpine: apk add --no-cache postgresql-client"
    echo "  CentOS/RHEL: sudo yum install -y postgresql" 
    echo "  Or run pg_dump from a postgres docker image as a fallback."
    exit 1
fi

# Create backup
echo "Creating backup: ${BACKUP_FILE}"
# Use PGPASSWORD env var when provided to avoid interactive prompt
PGPASSWORD_ENV=""
if [ -n "${PGPASSWORD}" ]; then
    PGPASSWORD_ENV="PGPASSWORD=${PGPASSWORD}"
fi

# Call pg_dump (defaults safe fallbacks for host/port/user if not set)
eval ${PGPASSWORD_ENV} pg_dump -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" -U "${PGUSER:-postgres}" -d "${DB_NAME}" > "${BACKUP_FILE}"

EXIT_CODE=$?
if [ ${EXIT_CODE} -eq 0 ]; then
    echo "Backup created successfully: ${BACKUP_FILE}"
    
    # Compress backup
    gzip "${BACKUP_FILE}"
    echo "Backup compressed: ${BACKUP_FILE}.gz"
    
    # Remove backups older than 7 days
    echo "Cleaning up old backups (keeping last 7 days)..."
    find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -type f -mtime +7 -delete
    echo "Cleanup completed"
else
    echo "Backup failed (pg_dump exit ${EXIT_CODE})."

    # Try docker fallback if a DB container name is provided or default to cortex_db
    DOCKER_DB_CONTAINER="${DOCKER_DB_CONTAINER:-cortex_db}"
    if command -v docker >/dev/null 2>&1; then
        # Check if the container is running
        if docker ps --format '{{.Names}}' | grep -w "${DOCKER_DB_CONTAINER}" >/dev/null 2>&1; then
            echo "Attempting fallback: running pg_dump inside docker container '${DOCKER_DB_CONTAINER}'..."
            # Run pg_dump inside container and stream output to host backup file
            # Use sh -c so we can pass PGPASSWORD inline if provided
            if [ -n "${PGPASSWORD}" ]; then
                docker exec -i "${DOCKER_DB_CONTAINER}" sh -c "PGPASSWORD='${PGPASSWORD}' pg_dump -U '${PGUSER:-postgres}' '${DB_NAME}'" > "${BACKUP_FILE}"
            else
                docker exec -i "${DOCKER_DB_CONTAINER}" sh -c "pg_dump -U '${PGUSER:-postgres}' '${DB_NAME}'" > "${BACKUP_FILE}"
            fi

            if [ $? -eq 0 ]; then
                echo "Backup created successfully via docker fallback: ${BACKUP_FILE}"
                gzip "${BACKUP_FILE}"
                echo "Backup compressed: ${BACKUP_FILE}.gz"
                echo "Cleaning up old backups (keeping last 7 days)..."
                find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -type f -mtime +7 -delete
                echo "Cleanup completed"
                exit 0
            else
                echo "Docker fallback failed. Backup not created."
                exit 1
            fi
        else
            echo "Docker container '${DOCKER_DB_CONTAINER}' not found or not running."
        fi
    else
        echo "Docker CLI not available on this host; cannot attempt container fallback."
    fi

    echo "Backup failed!"
    exit 1
fi

