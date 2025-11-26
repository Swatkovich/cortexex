# Deployment Guide for VDS with Existing Nginx

This guide explains how to deploy CortexEx on a VDS where nginx is already running.

## Changes Made

### 1. Port Configuration
- **Frontend**: Changed from port `3000` to `3001` (since 3000 is already used by your existing app)
- **Backend**: Exposed on port `5000`
- Both services now expose ports to the host so your existing nginx can proxy to them

### 2. Docker Compose
- Added port mappings: `3001:3001` for frontend, `5000:5000` for backend
- Services are accessible via `localhost:3001` and `localhost:5000`

## Deployment Steps

### Step 1: Deploy CortexEx

1. **Navigate to your deployment directory:**
   ```bash
   cd /srv/cortexex  # or wherever you place CortexEx
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Start CortexEx services:**
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

### Step 2: Configure Existing Nginx

You need to add the CortexEx configuration to your existing nginx container.

1. **Access your nginx container or configuration:**
   ```bash
   # If nginx config is in a volume, find it:
   docker inspect app-nginx-1 | grep -A 10 Mounts
   ```

2. **Add these location blocks to your nginx configuration:**

   ```nginx
   # CortexEx Frontend
   location /cortexex/ {
       proxy_pass http://localhost:3001/;   # ← trailing slash is required
       proxy_http_version 1.1;

       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;

       # Important: allows correct Next.js asset loading
       proxy_set_header X-Forwarded-Prefix /cortexex;

       # WebSocket support
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";

       proxy_read_timeout 60s;
   }

   # CortexEx Backend API
   location /api/ {
       proxy_pass http://localhost:5000/;
       proxy_http_version 1.1;

       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;

       add_header Access-Control-Allow-Origin "https://whereitleads.io";
       add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
       add_header Access-Control-Allow-Headers "Content-Type, Authorization";
       add_header Access-Control-Allow-Credentials "true";

       if ($request_method = OPTIONS) {
           return 204;
       }
   }
   ```

3. **Test nginx configuration:**
   ```bash
   docker exec app-nginx-1 nginx -t
   ```

4. **Reload nginx:**
   ```bash
   docker exec app-nginx-1 nginx -s reload
   ```

### Step 3: Verify Deployment

1. **Check CortexEx services:**
   ```bash
   docker-compose ps
   ```

2. **Check logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Test endpoints:**
   - Frontend: `https://whereitleads.io/cortexex`
   - Backend API: `https://whereitleads.io/api`

## Important Notes

- **Port 3001**: Frontend runs on port 3001 to avoid conflict with your existing app on port 3000
- **Port 5000**: Backend runs on port 5000 (make sure this port is not used by another service)
- **Network Isolation**: CortexEx services use their own Docker network (`cortexex_network`) but expose ports to the host
- **Existing Nginx**: Your existing nginx container proxies to CortexEx via `localhost:3001` and `localhost:5000`

## Troubleshooting

### Frontend not loading
- Check if port 3001 is accessible: `curl http://localhost:3001`
- Verify nginx configuration includes `/cortexex/` location block
- Check frontend logs: `docker-compose logs frontend`

### Backend API not responding
- Check if port 5000 is accessible: `curl http://localhost:5000`
- Verify nginx configuration includes `/api/` location block
- Check backend logs: `docker-compose logs backend`

### Port conflicts
If port 5000 is also taken, change it in:
- `docker-compose.yml`: Change `5000:5000` to `5001:5000` (or another port)
- `nginx.conf`: Update `proxy_pass http://localhost:5000/` to the new port
- Rebuild and restart services

