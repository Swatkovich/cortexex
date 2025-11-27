#!/bin/bash

# Папка для бэкапов
BACKUP_DIR="../backups"

# Дата для имени файла
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Файл бэкапа
BACKUP_FILE="${BACKUP_DIR}/cortexex_${TIMESTAMP}.sql"

# Создать бэкап через контейнер Docker
docker exec -i cortexex_db pg_dump -U SwatkovichS cortexex > "${BACKUP_FILE}"

# Удаляем файлы старше 7 дней
find "${BACKUP_DIR}" -type f -name "cortexex_*.sql" -mtime +7 -delete