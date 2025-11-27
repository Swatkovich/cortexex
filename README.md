# CortexEx

Learning/training platform that lets users create themed question sets, run short quiz sessions, and visualise progress. The monorepo hosts a Next.js frontend, a Node/Express-style backend, and Ops tooling (Docker, backups, scripts) for PostgreSQL deployments.

## Table of contents

1. [System overview](#system-overview)
2. [Tech stack](#tech-stack)
3. [Repository layout](#repository-layout)
4. [Prerequisites](#prerequisites)
5. [Environment configuration](#environment-configuration)
6. [Quick start with Docker](#quick-start-with-docker)
7. [Local development](#local-development)
8. [Database setup & migrations](#database-setup--migrations)
9. [Deployment options](#deployment-options)
10. [Reverse proxy / nginx](#reverse-proxy--nginx)
11. [Backups & maintenance](#backups--maintenance)
12. [Scripts & useful commands](#scripts--useful-commands)
13. [Troubleshooting](#troubleshooting)
14. [Contributing & license](#contributing--license)

## System overview

- Themes contain multiple questions across input/select/radio types with optional strict validation.
- Players launch lightweight games, accumulate per-question scores, and view diagrams of their knowledge areas.
- Background jobs keep the database backed up and prune historical dumps.
- The stack is optimised for subpath deployments (served from `/cortexex` by default).

## Tech stack

| Area      | Tools |
|-----------|-------|
| Frontend  | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Backend   | Node.js, TypeScript, Express-style routing/controllers |
| Database  | PostgreSQL (`backend/schema.sql` + migrations) |
| Tooling   | Docker & docker-compose, ESLint, TypeScript, cron-based backups |

## Repository layout

- `frontend/` – Next.js app, shared UI components, stores, hooks, i18n.
- `backend/` – Controllers, services, DB access layer, middleware, SQL schema.
- `scripts/` – Shell & PowerShell helpers (`backup.sh`, `init-db.sh`, `migrate-db.sh`, `backup_docker.sh`).
- `docker-compose.yml` – Multi-service setup (frontend, backend, db, backup).
- `backups/` – Rolling compressed SQL dumps (generated when Docker backup service or cron job runs).
- `nginx.conf` – Example reverse proxy configuration for `/cortexex` + `/api`.

## Prerequisites

- Docker + Docker Compose **or** Node 18+, npm, and PostgreSQL 14+.
- Access to a PostgreSQL instance (local container or managed service).
- Optional: domain + nginx/Apache for production.
- PostgreSQL client binaries (`psql`), required for manual schema/migration runs.

## Environment configuration

1. Duplicate the sample env: `cp .env.example .env`.
2. Update secrets and URLs:
   - `DB_PASSWORD`, `POSTGRES_PASSWORD`, `POSTGRES_USER`, `POSTGRES_DB`.
   - `NEXT_PUBLIC_BASE_PATH=/cortexex` if deploying under a subpath (default is already set in frontend config).
   - `NEXT_PUBLIC_API_URL`, `FRONTEND_URL`, `BACKEND_URL`.
3. Ensure the frontend `.env` points to the backend `/api` endpoint and matches the nginx reverse proxy paths.

## Quick start with Docker

```bash
cp .env.example .env            # adjust values
docker-compose up -d --build    # build images and start services
docker-compose ps               # confirm all services are healthy
docker-compose logs -f          # stream logs if needed
```

What you get:
- PostgreSQL (`db`) with persisted volume.
- Backend API on port `5000`.
- Frontend Next.js app on port `3000` (or `3001` in the VDS variant below).
- Backup service scheduled for daily runs at 02:00, writing to `./backups`.

## Local development

Run services independently if you prefer not to use Docker:

Frontend:
```bash
cd frontend
npm install
npm run dev    # http://localhost:3000 (or matching basePath)
```

Backend:
```bash
cd backend
npm install
npm run dev    # default http://localhost:5000
```

Helpful steps:
- Copy `backend/.env.example` (if provided) or export the same values you use for Docker.
- Use a local PostgreSQL instance or run `docker-compose up db` to reuse the containerised database.

## Database setup & migrations

1. Apply the canonical schema:
   ```bash
   docker-compose exec -T db psql -U cortexex -d cortexex < backend/schema.sql
   ```
2. Apply incremental migrations:
   ```bash
   for migration in backend/migrations/*.sql; do
     docker-compose exec -T db psql -U cortexex -d cortexex < "$migration"
   done
   ```
3. Alternatively run the helper scripts:
   - Linux/macOS: `bash scripts/init-db.sh`
   - Windows PowerShell: see inline commands in `scripts/migrate-db.ps1`

Schema notes (from `backend/DATABASE_SETUP.md`):
- Themes and questions are related via `theme_id`; deletes cascade.
- `questions.answer` column stores the expected text for `input` questions.
- Use `\dt`, `\d themes`, `\d questions` inside `psql` to verify.
- Run `ALTER TABLE questions ADD COLUMN IF NOT EXISTS answer TEXT;` if upgrading an old DB.

## Deployment options

### Standard Docker Compose (ports 3000/5000)
1. Follow the [Quick start](#quick-start-with-docker).
2. Make scripts executable: `chmod +x scripts/*.sh`.
3. Configure cron/backup if you run scripts on the host (see [Backups](#backups--maintenance)).
4. Point your reverse proxy to `localhost:3000` (frontend) and `localhost:5000` (API).

### VDS / shared host (frontend on port 3001)
Use this when port `3000` is already occupied:

1. Update `docker-compose.yml` to expose `3001:3001` for the frontend and keep `5000:5000` for the backend (already configured in `DEPLOYMENT_VDS` scenario).
2. Start services as usual: `docker-compose up -d --build`.
3. Reuse the same DB init commands as above.
4. Configure nginx to proxy `/cortexex/` to `localhost:3001/` and `/api/` to `localhost:5000/`, ensuring `X-Forwarded-Prefix` is set so Next.js assets load correctly.

### Data migration between environments

```bash
# Linux / macOS
export LOCAL_DB_URL="postgresql://user:password@localhost:5432/cortexex"
export REMOTE_DB_URL="postgresql://user:password@remote:5432/cortexex"
bash scripts/migrate-db.sh
```

```powershell
# Windows PowerShell
$env:LOCAL_DB_URL="postgresql://user:password@localhost:5432/cortexex"
$env:REMOTE_DB_URL="postgresql://user:password@remote:5432/cortexex"
.\scripts\migrate-db.ps1
```

> ⚠️ The remote database is overwritten. Always create a backup first.

## Reverse proxy / nginx

Minimal configuration for serving the app at `/cortexex` and the API at `/api`:

```nginx
location /cortexex/ {
    proxy_pass http://127.0.0.1:3000/;    # use 3001 if you followed the VDS setup
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Prefix /cortexex;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

location /api/ {
    proxy_pass http://127.0.0.1:5000/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

For locked-down environments (e.g., existing nginx container), append CORS headers and WebSocket settings as shown in `DEPLOYMENT_VDS.md`. Always validate and reload: `nginx -t && nginx -s reload`.

## Backups & maintenance

- **Automated backups**: `backup` service runs daily at 02:00, producing `./backups/cortexex_YYYYMMDD_HHMMSS.sql.gz`. Latest 7 days are kept.
- **Manual backup**: `docker-compose exec backup /backup.sh`.
- **Host cron alternative**:  
  `echo "0 2 * * * /absolute/path/to/project/scripts/backup.sh >> /var/log/cortexex-backup.log 2>&1" | crontab -`
- **Restore**:
  ```bash
  gunzip backups/cortexex_YYYYMMDD_HHMMSS.sql.gz
  docker-compose exec -T db psql -U cortexex -d cortexex < backups/cortexex_YYYYMMDD_HHMMSS.sql
  ```

## Scripts & useful commands

| Command | Description |
|---------|-------------|
| `docker-compose up -d --build` | Build and start all services |
| `docker-compose down [-v]` | Stop (and optionally wipe volumes) |
| `docker-compose logs -f [service]` | Tail logs |
| `docker-compose exec db psql -U cortexex -d cortexex` | Open psql shell |
| `chmod +x scripts/*.sh` | Ensure scripts are executable on Unix hosts |
| `bash scripts/backup.sh` | Manual backup when not using the Docker service |

## Troubleshooting

- **Services won’t start**: inspect `docker-compose logs <service>` and ensure required ports are free.
- **Frontend 404 or assets missing**: verify `NEXT_PUBLIC_BASE_PATH=/cortexex` and the nginx `X-Forwarded-Prefix` header; ensure you proxy to the correct port (3000 vs 3001).
- **Backend DB errors**: confirm `DATABASE_URL`/`DB_PASSWORD`, check `docker-compose ps` to ensure the database is healthy, and run migrations again if tables are missing.
- **Backup failures**: look at `docker-compose logs backup`, confirm cron schedule, and check write permissions on `./backups`.
- **Port conflicts**: adjust the host port mapping inside `docker-compose.yml` (e.g., `5001:5000`) and update nginx accordingly.

## Contributing & license

- Fork the repo, make focused changes, and submit pull requests.
- Run linting/TypeScript checks before pushing: `npm run lint` / `npx tsc --noEmit` in both `frontend/` and `backend/`.
- License: MIT (add a `LICENSE` file if you plan to distribute builds widely).

Questions or ops-specific notes should live alongside your internal runbooks—this README now centralises all previous `.md` and `.txt` guides.