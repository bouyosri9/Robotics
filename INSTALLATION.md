# Installation & Setup Guide

## Prerequisites

- **Docker & Docker Compose** (v23+)
  - [Install Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Node.js** (v20+) - only required for local development
  - [Install Node.js](https://nodejs.org/)
- **Git**
- **4GB RAM** minimum for local containerized deployment

## Quick Start with Docker Compose

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/robot-collaborative-simulator.git
cd robot-collaborative-simulator
```

### 2. Start All Services

```bash
docker compose up -d
```

This starts 5 services:
- **Frontend** - http://localhost:8090
- **Backend API** - http://localhost:4000
- **Prometheus** - http://localhost:9090
- **Grafana** - http://localhost:3001 (user: admin, password: changeme123)
- **cAdvisor** - http://localhost:8080

### 3. Verify Deployment

Check health status:
```bash
docker compose ps
```

All services should show `Up` status.

### 4. Test the Application

```bash
# Frontend
open http://localhost:8090

# API health check
curl http://localhost:4000/health

# WebSocket test (should return robot state)
curl http://localhost:4000/api/state
```

### 5. Stop Services

```bash
docker compose down
```

To remove volumes and data:
```bash
docker compose down -v
```

## Local Development Setup

For development without Docker containers:

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Or start production build
npm start
```

Server runs on `http://localhost:4000`

**Environment Variables:**
```bash
# .env or shell
export PORT=4000
export FRONTEND_ORIGIN=http://localhost:5173
export NODE_ENV=development
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Dev server runs on `http://localhost:5173`

**Environment Variables:**
```bash
# .env.local or .env.development
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=ws://localhost:4000/ws
```

### Connect Frontend to Backend

Once both servers are running, they auto-connect. Browser console should show:
```
[ws] Connection established
[API] State received: {joints: {...}, tcp: {...}}
```

## Docker Build & Deployment

### Build Images Locally

```bash
# Build all images
docker compose build --no-cache

# Build specific service
docker compose build --no-cache backend
docker compose build --no-cache frontend
```

### Push to Registry (Optional)

```bash
# Tag images
docker tag robot-backend:latest myregistry/robot-backend:latest
docker tag robot-frontend:latest myregistry/robot-frontend:latest

# Push
docker push myregistry/robot-backend:latest
docker push myregistry/robot-frontend:latest
```

## Production Deployment on Azure VM

### Prerequisites
- Azure account
- Terraform installed
- Azure CLI configured

### Step 1: Provision VM with Terraform

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

This creates:
- VM (e.g., Ubuntu 22.04)
- Virtual Network & Security Groups
- Storage for data persistence

### Step 2: SSH to VM

```bash
ssh azureuser@<vm-public-ip>
```

### Step 3: Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### Step 4: Deploy with Docker Compose

```bash
# Clone repo
git clone https://github.com/yourusername/robot-collaborative-simulator.git
cd robot-collaborative-simulator

# Configure environment
export FRONTEND_ORIGIN=https://your-domain.com
export GRAFANA_ADMIN_PASSWORD=strongpassword

# Start services
docker compose up -d

# Check logs
docker compose logs -f
```

### Step 5: Configure Nginx (Optional Reverse Proxy)

If using a reverse proxy on the VM:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://localhost:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location /ws {
        proxy_pass http://localhost:4000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### Step 6: SSL/TLS with Let's Encrypt (Recommended)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

## Monitoring Stack Configuration

### Prometheus

**Config:** `prometheus.yml`

Scrapes metrics from:
- Backend `/metrics` endpoint
- cAdvisor on port 8080

```yaml
scrape_configs:
  - job_name: 'robot-backend'
    static_configs:
      - targets: ['localhost:4000']
  
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
```

### Grafana

Access: `http://localhost:3001`

**Setup:**
1. Login with default credentials (admin/changeme123)
2. Change admin password
3. Add Prometheus data source:
   - URL: `http://prometheus:9090`
   - Save & Test
4. Import dashboards for monitoring

## Troubleshooting

### Frontend shows "Connection refused"

**Check:**
```bash
# Backend running?
curl http://localhost:4000/health

# Environment variables correct?
echo $VITE_API_URL
echo $VITE_WS_URL

# Firewall blocking?
netstat -tuln | grep 4000
```

**Fix:**
```bash
# Rebuild frontend with correct env vars
docker compose down frontend
docker compose build --no-cache frontend
docker compose up -d frontend
```

### WebSocket connection fails

**Check logs:**
```bash
docker compose logs backend
```

**Common issues:**
- Wrong `VITE_WS_URL` - should use `ws://` not `http://`
- CORS origin mismatch - check `FRONTEND_ORIGIN` in backend env
- Firewall blocking port 4000

### Services won't start

**Check:**
```bash
# Port conflicts?
docker compose ps
netstat -tuln | grep -E '4000|8090|9090|3001'

# Logs?
docker compose logs

# Resource issues?
docker stats
```

**Fix:**
```bash
# Restart everything
docker compose restart

# Or full cleanup and rebuild
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Performance issues

**Check resource usage:**
```bash
docker stats
docker compose logs backend
```

**Optimize:**
- Increase Docker memory/CPU allocation
- Check backend logs for errors
- Monitor Grafana dashboards
- Review WebSocket connection count

## Development Workflow

### Making Code Changes

**Frontend:**
```bash
cd frontend
# Dev server auto-reloads on file changes
npm run dev
```

**Backend:**
```bash
cd backend
# Node --watch auto-restarts on file changes
npm run dev
```

### Running Tests

```bash
# Frontend linting
cd frontend
npm run lint

# Backend - add test suite as needed
cd backend
npm test  # when implemented
```

### Building Production Release

```bash
# Frontend
cd frontend
npm run build
# Output: dist/

# Backend
# No build needed - runs directly with npm start

# Docker
docker compose build --no-cache
```

## Configuration Reference

### Environment Variables

**Frontend (.env.development or .env.production):**
```
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=ws://localhost:4000/ws
```

**Backend (.env or shell):**
```
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
NODE_ENV=development
```

**Docker Compose (.env):**
```
GRAFANA_ADMIN_PASSWORD=changeme123
COMPOSE_PROJECT_NAME=robot-simulator
```

### Port Mapping

| Service | Internal | External | Protocol |
|---------|----------|----------|----------|
| Frontend | 80 | 8090 | HTTP |
| Backend | 4000 | 4000 | HTTP/WS |
| Prometheus | 9090 | 9090 | HTTP |
| Grafana | 3000 | 3001 | HTTP |
| cAdvisor | 8080 | 8080 | HTTP |

## Next Steps

1. **Customize Robot Catalog** - Edit `frontend/src/RobotCatalog.jsx`
2. **Extend API** - Add new routes in `backend/src/routes.js`
3. **Setup Monitoring** - Configure Grafana dashboards
4. **Add Authentication** - Implement JWT tokens
5. **Enable SSL/TLS** - Use Let's Encrypt certificates

For more details, see [DEVELOPMENT.md](DEVELOPMENT.md)
