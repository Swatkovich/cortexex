# CortexEx

Project overview
----------------

CortexEx is a small learning/training platform that lets users create themed question sets, play short quiz-style sessions, and track per-user knowledge statistics. This repository contains a Next.js frontend and a TypeScript/Node backend with a PostgreSQL database.

Key features
 - Create and manage themes and questions (input/multiple choice/radio)
 - Play game sessions with per-question scoring and persistence
 - Per-user statistics and diagrams to visualise knowledge
 - Background backups and optional Docker-based deployment

Tech stack
----------
- Frontend: Next.js (app router), React, TypeScript, Tailwind CSS
- Backend: Node.js, TypeScript, Express-style controllers, PostgreSQL
- Persistence: PostgreSQL (migrations and schema in `backend/`)
- Dev tooling: Docker / docker-compose (optional), ESLint, TypeScript

Repository structure (top-level)
-------------------------------
- `backend/` — server code, controllers, DB migrations, scripts
- `frontend/` — Next.js app (app router), components and lib
- `scripts/` — utility scripts (backups, DB init/migrate)
- `DEPLOYMENT_INSTRUCTIONS.txt` — detailed deploy guide
- `DEPLOYMENT_UNSTUCTIONS.txt` — short deploy checklist (copyable)

Quick development (local)
-------------------------
1. Install dependencies (root-level operations vary by setup; see below).

Frontend (from `frontend/`):
```bash
cd frontend
npm install
npm run dev
# open http://localhost:3000
```

Backend (from `backend/`):
```bash
cd backend
npm install
npm run dev
# default port configured in env or tsconfig
```

Database
--------
- Use the Docker Compose setup (recommended) or a local PostgreSQL instance.
- To run with Docker Compose: `docker-compose up -d --build` (see `DEPLOYMENT_INSTRUCTIONS.txt`).

Notes on deployment and ops
---------------------------
This README is intentionally informational. The full deployment guide is included below.

## Deployment

The quick deployment instructions below are a copy from the repository's deployment guide. For most cases use Docker Compose; if you prefer manual deployment, follow the Node+Postgres steps and nginx notes.

1) Prerequisites
	- Docker & `docker-compose` or Node + PostgreSQL installed.
	- Domain + `nginx` if exposing on the web.

2) Basic deploy (Docker Compose)
	- Copy env: `cp .env.example .env` and edit values.
	- Build & start: `docker-compose up -d --build`
	- Check: `docker-compose ps` and `docker-compose logs -f`.

3) File permissions (make scripts executable)
	- On Unix hosts run: ``chmod +x scripts/backup.sh scripts/init-db.sh scripts/migrate-db.sh``

4) Cron / backups
	- Install crontab entry for host (example daily 02:00):
		``echo "0 2 * * * /absolute/path/to/project/scripts/backup.sh >> /var/log/cortexex-backup.log 2>&1" | crontab -``
	- Or use the Docker backup service (see `docker-compose`). Verify with `crontab -l`.

5) Nginx (reverse proxy) minimal notes
	- Proxy root path (example `/cortexex`) to frontend:

```nginx
location /cortexex/ {
	proxy_pass http://127.0.0.1:3000/;
	proxy_set_header Host $host;
	proxy_set_header X-Real-IP $remote_addr;
	proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	proxy_set_header X-Forwarded-Proto $scheme;
	proxy_set_header X-Forwarded-Prefix /cortexex;
	proxy_http_version 1.1;
	proxy_set_header Upgrade $http_upgrade;
	proxy_set_header Connection "upgrade";
}
```

	- Proxy API `/api` to backend (port 5000):

```nginx
location /api/ { proxy_pass http://127.0.0.1:5000/; }
```

	- Test and reload: ``sudo nginx -t && sudo systemctl reload nginx``

6) Quick verify
	- Frontend: visit `https://yourdomain/cortexex`
	- API: `curl -s https://yourdomain/api/health` or open `/api`
	- DB: `docker-compose exec db psql -U $DB_USER -d $DB_NAME -c "\dt"`

7) Useful commands
	- Start: `docker-compose up -d --build`
	- Stop: `docker-compose down`
	- Logs: `docker-compose logs -f`
	- Rebuild service: `docker-compose up -d --build <service>`

Make sure to keep any host-specific notes (absolute paths, service users, firewall rules) in your deployment runbook. The repository also contains `DEPLOYMENT_UNSTUCTIONS.txt` (short checklist) referenced elsewhere.

Contributing
------------
- Fork and send pull requests. Keep changes small and focused.
- Run linters and TypeScript checks before submitting: `npm run lint` / `npx tsc --noEmit` in respective folders.

License & contact
-----------------
- Project: MIT (or your preferred license) — add `LICENSE` file if needed.
- Author / Maintainer: refer to repository owner for contact.

If you want, I can also convert other README files (`frontend/README.md`, `README_DOCKER.md`) to follow this same informational structure.