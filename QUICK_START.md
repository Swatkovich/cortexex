# Quick Start Guide

## Prerequisites
- Docker and Docker Compose installed
- PostgreSQL client tools (for migration, optional)

## Step 1: Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your values:
   ```env
   DB_PASSWORD=your_secure_password_here
   FRONTEND_URL=https://whereitleads.io
   NEXT_PUBLIC_API_URL=https://whereitleads.io/api
   ```

## Step 2: Start Services

```bash
docker-compose up -d --build
```

This will:
- Build backend and frontend Docker images
- Start PostgreSQL database
- Start backend API server
- Start frontend Next.js app
- Start backup service

## Step 3: Initialize Database

```bash
# On Linux/Mac
bash scripts/init-db.sh

# On Windows (PowerShell)
# You can run the commands manually:
docker-compose exec -T db psql -U cortexex -d cortexex < backend/schema.sql
```

## Step 4: Configure Reverse Proxy

Configure your web server (nginx/Apache) to proxy:
- `/cortexex` → `http://localhost:3000`
- `/api` → `http://localhost:5000`

See `nginx.conf.example` for nginx configuration.

## Step 5: Migrate Local Database (Optional)

If you have a local database to migrate:

### Linux/Mac:
```bash
export LOCAL_DB_URL="postgresql://user:password@localhost:5432/cortexex"
export REMOTE_DB_URL="postgresql://user:password@your-server:5432/cortexex"
bash scripts/migrate-db.sh
```

### Windows:
```powershell
$env:LOCAL_DB_URL="postgresql://user:password@localhost:5432/cortexex"
$env:REMOTE_DB_URL="postgresql://user:password@your-server:5432/cortexex"
.\scripts\migrate-db.ps1
```

## Verify Installation

1. Check services are running:
   ```bash
   docker-compose ps
   ```

2. Check logs:
   ```bash
   docker-compose logs -f
   ```

3. Access the application:
   - Frontend: `https://whereitleads.io/cortexex`
   - Backend API: `https://whereitleads.io/api`

## Daily Backups

Backups run automatically at 2 AM daily:
- Location: `./backups/`
- Format: `cortexex_YYYYMMDD_HHMMSS.sql.gz`
- Retention: Last 7 days

Manual backup:
```bash
docker-compose exec backup /backup.sh
```

## Troubleshooting

### Services won't start
- Check logs: `docker-compose logs [service_name]`
- Verify `.env` file is configured correctly
- Ensure ports are not already in use

### Database connection errors
- Wait for database to be healthy: `docker-compose ps`
- Check DATABASE_URL in backend environment
- Verify database credentials

### Frontend not loading
- Check NEXT_PUBLIC_BASE_PATH is set to `/cortexex`
- Verify reverse proxy configuration
- Check frontend logs: `docker-compose logs frontend`

