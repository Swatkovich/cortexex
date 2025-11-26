#!/bin/bash

# Database migration script
# Migrates local database to remote database

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Database Migration Script${NC}"
echo "================================"
echo ""

# Check if required environment variables are set
if [ -z "$LOCAL_DB_URL" ]; then
    echo -e "${RED}Error: LOCAL_DB_URL environment variable is not set${NC}"
    echo "Example: postgresql://user:password@localhost:5432/dbname"
    exit 1
fi

if [ -z "$REMOTE_DB_URL" ]; then
    echo -e "${RED}Error: REMOTE_DB_URL environment variable is not set${NC}"
    echo "Example: postgresql://user:password@remote-host:5432/dbname"
    exit 1
fi

# Create temporary backup file
TEMP_BACKUP="/tmp/cortexex_migration_$(date +%Y%m%d_%H%M%S).sql"

echo -e "${YELLOW}Step 1: Creating backup from local database...${NC}"
pg_dump "$LOCAL_DB_URL" > "$TEMP_BACKUP"

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to create backup from local database${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Backup created successfully${NC}"
echo ""

echo -e "${YELLOW}Step 2: Restoring backup to remote database...${NC}"
echo -e "${YELLOW}Warning: This will overwrite existing data in the remote database!${NC}"
read -p "Do you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Migration cancelled${NC}"
    rm "$TEMP_BACKUP"
    exit 0
fi

psql "$REMOTE_DB_URL" < "$TEMP_BACKUP"

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to restore backup to remote database${NC}"
    rm "$TEMP_BACKUP"
    exit 1
fi

echo -e "${GREEN}✓ Migration completed successfully${NC}"
echo ""

# Clean up
rm "$TEMP_BACKUP"
echo -e "${GREEN}Migration finished!${NC}"

