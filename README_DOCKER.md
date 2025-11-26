# Docker Setup for CortexEx

This guide explains how to set up and deploy CortexEx using Docker and Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL client tools (for migration)

## Quick Start

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file** with your configuration:
   - Set secure database passwords
   - Configure frontend URL (should be `https://whereitleads.io`)
   - Set API URL for frontend

3. **Build and start services:**
   ```bash
   docker-compose up -d --build
   ```

4. **Initialize database:**
   ```bash
   # Apply schema
   docker-compose exec -T db psql -U cortexex -d cortexex < backend/schema.sql
   
   # Apply migrations
   for migration in backend/migrations/*.sql; do
     docker-compose exec -T db psql -U cortexex -d cortexex < "$migration"
   done
   ```

## Services

- **db**: PostgreSQL database
- **backend**: Express API server (port 5000)
- **frontend**: Next.js application (port 3000)
- **backup**: Automated daily backup service

## Configuration

### Subpath Deployment

The frontend is configured to run at `/cortexex` subpath. This is set in:
- `frontend/next.config.ts` - `basePath` and `assetPrefix`
- Environment variable `NEXT_PUBLIC_BASE_PATH=/cortexex`

### Reverse Proxy Setup

To serve the application at `whereitleads.io/cortexex`, configure your reverse proxy (nginx/Apache):

#### Nginx Example:
```nginx
location /cortexex {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}

location /api {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Database Backups

The backup service runs automatically every day at 2 AM:
- Backups are stored in `./backups/` directory
- Backups are compressed (`.sql.gz` format)
- Only the last 7 days of backups are kept
- Older backups are automatically deleted

### Manual Backup

To create a manual backup:
```bash
docker-compose exec backup /backup.sh
```

### Restore from Backup

```bash
# Extract backup
gunzip backups/cortexex_YYYYMMDD_HHMMSS.sql.gz

# Restore
docker-compose exec -T db psql -U cortexex -d cortexex < backups/cortexex_YYYYMMDD_HHMMSS.sql
```

## Database Migration

To migrate your local database to the remote database:

### On Linux/Mac:
```bash
export LOCAL_DB_URL="postgresql://user:password@localhost:5432/cortexex"
export REMOTE_DB_URL="postgresql://user:password@remote-host:5432/cortexex"
bash scripts/migrate-db.sh
```

### On Windows (PowerShell):
```powershell
$env:LOCAL_DB_URL="postgresql://user:password@localhost:5432/cortexex"
$env:REMOTE_DB_URL="postgresql://user:password@remote-host:5432/cortexex"
.\scripts\migrate-db.ps1
```

**Important:** This will overwrite the remote database. Make sure to backup the remote database first!

## Useful Commands

### View logs:
```bash
docker-compose logs -f [service_name]
```

### Stop services:
```bash
docker-compose down
```

### Stop and remove volumes (⚠️ deletes database):
```bash
docker-compose down -v
```

### Rebuild a specific service:
```bash
docker-compose build [service_name]
docker-compose up -d [service_name]
```

### Access database:
```bash
docker-compose exec db psql -U cortexex -d cortexex
```

## Troubleshooting

### Frontend not loading at /cortexex
- Check that `NEXT_PUBLIC_BASE_PATH=/cortexex` is set in environment
- Verify reverse proxy configuration
- Check frontend logs: `docker-compose logs frontend`

### Backend connection issues
- Verify `DATABASE_URL` in backend environment
- Check database is healthy: `docker-compose ps`
- Check backend logs: `docker-compose logs backend`

### Backup not working
- Check backup logs: `docker-compose logs backup`
- Verify cron is running: `docker-compose exec backup crontab -l`
- Check backup directory permissions

