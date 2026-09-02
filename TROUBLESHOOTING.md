# Troubleshooting Guide

## Problem: Application Won't Start

### Docker containers won't start

**Symptoms:**
```
ERROR: Unable to start service backend
docker: Error response from daemon
```

**Solutions:**

1. **Check Docker is running:**
   ```bash
   docker ps
   ```
   If not running, start Docker Desktop.

2. **Check port conflicts:**
   ```bash
   # Find what's using ports 4000, 8090, etc.
   netstat -tuln | grep -E '4000|8090|9090|3001|8080'
   ```
   
   Kill conflicting processes:
   ```bash
   # Linux/Mac
   lsof -i :4000 | grep LISTEN | awk '{print $2}' | xargs kill -9
   
   # Windows
   netstat -ano | findstr :4000
   taskkill /PID <PID> /F
   ```

3. **Rebuild images:**
   ```bash
   docker compose down -v
   docker compose build --no-cache
   docker compose up -d
   docker compose logs
   ```

4. **Check system resources:**
   ```bash
   docker stats
   # If high usage, increase Docker memory in settings
   ```

---

## Problem: Can't Access Frontend

### Symptoms:
- "Unable to connect to server"
- Blank page or error
- Port 8090 not responding

### Solutions:

1. **Verify container is running:**
   ```bash
   docker compose ps frontend
   ```
   
   Should show `Up` status. If not:
   ```bash
   docker compose up -d frontend
   docker compose logs frontend
   ```

2. **Check port mapping:**
   ```bash
   docker port robot-frontend
   # Should show: 80/tcp -> 0.0.0.0:8090
   ```

3. **Verify Nginx is serving:**
   ```bash
   curl http://localhost:8090
   # Should return HTML
   
   # Or with Docker
   docker compose exec frontend curl http://localhost:80
   ```

4. **Check frontend build:**
   ```bash
   docker compose exec frontend ls -la /usr/share/nginx/html
   # Should contain: index.html, assets/
   ```

5. **Rebuild frontend:**
   ```bash
   docker compose down frontend
   docker compose build --no-cache frontend
   docker compose up -d frontend
   ```

---

## Problem: WebSocket Connection Failed

### Symptoms:
- "WebSocket is closed"
- State not updating in real-time
- Console error: "ws://localhost:4000/ws: failed to connect"

### Solutions:

1. **Verify backend is running:**
   ```bash
   curl http://localhost:4000/health
   # Should return: {"status":"ok","uptime":...}
   ```
   
   If not, start it:
   ```bash
   docker compose up -d backend
   docker compose logs backend
   ```

2. **Check WebSocket endpoint is accessible:**
   ```bash
   # Using wscat (install: npm i -g wscat)
   wscat -c ws://localhost:4000/ws
   # Should connect and show JSON messages
   
   # Or test in browser console:
   const ws = new WebSocket('ws://localhost:4000/ws');
   ws.onopen = () => console.log('Connected');
   ws.onmessage = e => console.log(JSON.parse(e.data));
   ```

3. **Check frontend environment variables:**
   ```bash
   # Frontend .env file should have:
   VITE_WS_URL=ws://localhost:4000/ws
   # NOT http:// or https://
   ```
   
   Rebuild if changed:
   ```bash
   docker compose down frontend
   docker compose build --no-cache frontend
   docker compose up -d frontend
   ```

4. **Check backend logs for errors:**
   ```bash
   docker compose logs -f backend
   # Look for WebSocket connection errors
   ```

5. **Verify CORS configuration:**
   ```bash
   # Backend should allow frontend origin
   # Check backend environment: FRONTEND_ORIGIN
   # Should match frontend URL
   ```

6. **Check firewall:**
   ```bash
   # Port 4000 might be blocked
   # Try from within container:
   docker compose exec frontend curl http://backend:4000/health
   ```

---

## Problem: API Requests Return 400/404

### Symptoms:
- "Command not found"
- "Invalid parameter"
- "JSON parse error"

### Solutions:

1. **Check endpoint URL:**
   ```bash
   # Wrong
   curl http://localhost:4000/state
   
   # Correct
   curl http://localhost:4000/api/state
   ```

2. **Verify request format:**
   ```bash
   # Must include Content-Type header
   curl -X POST http://localhost:4000/api/command \
     -H "Content-Type: application/json" \
     -d '{"command":"start"}'
   ```

3. **Check request body format:**
   ```javascript
   // Wrong
   {"command": "START"}  // uppercase not valid
   {"command": "play"}   // invalid command
   
   // Correct
   {"command": "start"}  // lowercase
   ```

4. **Validate joint values:**
   ```bash
   # Wrong - out of limits
   curl -X POST http://localhost:4000/api/joints \
     -H "Content-Type: application/json" \
     -d '{"j1": 200}'  # Max is 180
   
   # Correct - within limits
   curl -X POST http://localhost:4000/api/joints \
     -H "Content-Type: application/json" \
     -d '{"j1": 90}'
   ```

5. **Check valid commands:**
   - `start` - Begin motion
   - `pause` - Pause motion
   - `stop` - Stop motion
   - `home` - Go to home pose

---

## Problem: Robot Doesn't Move

### Symptoms:
- Joint angles not changing
- Command executed but no animation
- WebSocket receiving updates but no visual change

### Solutions:

1. **Check robot status:**
   ```bash
   curl http://localhost:4000/api/state | jq '.status'
   # Should be: "running" or "idle"
   ```

2. **Verify command was sent:**
   ```bash
   # Terminal 1: Watch state
   while true; do curl http://localhost:4000/api/state | jq '.target'; sleep 1; done
   
   # Terminal 2: Send command
   curl -X POST http://localhost:4000/api/command \
     -H "Content-Type: application/json" \
     -d '{"command":"start"}'
   ```

3. **Check if at target:**
   ```bash
   curl http://localhost:4000/api/state | jq '{joints: .joints, target: .target}'
   # If joints == target, robot is already there
   # Set new target to move:
   curl -X POST http://localhost:4000/api/joints \
     -H "Content-Type: application/json" \
     -d '{"j1":90,"j2":-60,"j3":80}'
   ```

4. **Check frontend 3D rendering:**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab - see WebSocket messages?
   - Try refreshing page

5. **Verify Three.js rendering:**
   ```javascript
   // In browser console:
   // Check if scene has objects
   console.log(scene.children);
   // Check if camera is positioned
   console.log(camera.position);
   ```

---

## Problem: High Memory Usage

### Symptoms:
- Docker container using excessive RAM
- System slow or unresponsive
- Docker Desktop consuming CPU

### Solutions:

1. **Check Docker resource usage:**
   ```bash
   docker stats
   # Watch for containers using >1GB RAM
   ```

2. **Identify memory leak:**
   ```bash
   # Monitor over time
   docker stats --no-stream --no-trunc robot-backend
   ```

3. **Check for infinite loops:**
   - Review recent code changes
   - Look for unclosed intervals: `setInterval()` without `clearInterval()`
   - Check WebSocket listeners registered but not removed

4. **Increase Docker memory allocation:**
   - Docker Desktop → Preferences → Resources
   - Increase Memory slider
   - Click "Apply & Restart"

5. **Optimize code:**
   ```javascript
   // Bad - creates memory leak
   setInterval(() => {
     const largeArray = new Array(1000000);
   }, 100);
   
   // Good - cleans up
   const interval = setInterval(() => {
     // Do work
   }, 100);
   // Later...
   clearInterval(interval);
   ```

---

## Problem: Frontend Shows Cached/Outdated Data

### Symptoms:
- Changes don't appear after deployment
- Showing old robot catalog
- Stale API responses

### Solutions:

1. **Clear browser cache:**
   ```bash
   # Browser DevTools (F12)
   # Application tab → Clear Site Data
   # Or: Ctrl+Shift+Delete
   ```

2. **Hard refresh:**
   ```bash
   # Windows/Linux: Ctrl+Shift+R
   # Mac: Cmd+Shift+R
   ```

3. **Clear Nginx cache:**
   ```bash
   docker compose exec frontend rm -rf /var/cache/nginx
   docker compose restart frontend
   ```

4. **Rebuild frontend:**
   ```bash
   docker compose down frontend
   docker compose build --no-cache frontend
   docker compose up -d frontend
   ```

5. **Check ServiceWorker (if added):**
   ```javascript
   // Unregister old workers
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(r => r.unregister());
   });
   ```

---

## Problem: Monitoring Not Working

### Symptoms:
- Prometheus has no data
- Grafana shows "No data source"
- cAdvisor not updating

### Solutions:

1. **Verify services are running:**
   ```bash
   docker compose ps prometheus grafana cadvisor
   ```

2. **Check Prometheus targets:**
   ```bash
   # Visit http://localhost:9090/targets
   # Should show "UP" status for endpoints
   
   # If DOWN, backend might not be responding
   docker compose logs prometheus
   ```

3. **Verify metrics endpoint exists:**
   ```bash
   curl http://localhost:4000/metrics
   # If 404, metrics endpoint not implemented in backend
   ```

4. **Check cAdvisor:**
   ```bash
   curl http://localhost:8080/api/v1.3/docker
   # Should return container metrics
   ```

5. **Restart monitoring stack:**
   ```bash
   docker compose restart prometheus grafana cadvisor
   docker compose logs -f prometheus
   ```

---

## Problem: Can't Connect to Backend from Frontend

### Symptoms:
- CORS error in browser console
- "Origin not allowed"
- Preflight request fails

### Solutions:

1. **Check backend CORS configuration:**
   ```bash
   # Backend should log on startup:
   # Origem autorisada (CORS): http://localhost:5173
   
   docker compose logs backend | grep -i cors
   ```

2. **Verify FRONTEND_ORIGIN environment variable:**
   ```bash
   # Should match frontend URL
   docker compose exec backend env | grep FRONTEND_ORIGIN
   ```

3. **Test CORS headers:**
   ```bash
   curl -H "Origin: http://localhost:5173" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type" \
        http://localhost:4000/api/state -v
   # Look for Access-Control-Allow-Origin header
   ```

4. **Update docker-compose.yml if needed:**
   ```yaml
   backend:
     environment:
       - FRONTEND_ORIGIN=http://localhost:5173
   ```
   
   Then:
   ```bash
   docker compose up -d backend
   ```

---

## Problem: Git/Repository Issues

### Symptoms:
- Merge conflicts
- Detached HEAD
- Changes not saved

### Solutions:

1. **Check status:**
   ```bash
   git status
   git log --oneline -5
   ```

2. **Resolve merge conflicts:**
   ```bash
   git merge --abort  # Cancel merge
   # Or manually edit conflicted files
   git add .
   git commit -m "resolve merge conflict"
   ```

3. **Recover from detached HEAD:**
   ```bash
   git checkout main
   # Or create new branch from current state
   git checkout -b recovery-branch
   ```

4. **Stash unfinished work:**
   ```bash
   git stash
   git stash list
   git stash pop
   ```

---

## Problem: Deployment Fails

### Symptoms:
- Terraform apply fails
- Docker push fails
- GitHub Actions workflow errors

### Solutions:

1. **Terraform errors:**
   ```bash
   terraform validate
   terraform plan -out=tfplan
   # Review plan before applying
   terraform apply tfplan
   ```

2. **Docker build fails:**
   ```bash
   # Check Dockerfile syntax
   docker build -f backend/Dockerfile backend
   # Look for layer failures
   ```

3. **GitHub Actions:**
   - Check workflow file syntax: `.github/workflows/deploy.yml`
   - Review logs in GitHub Actions tab
   - Verify secrets are configured

4. **Registry authentication:**
   ```bash
   docker login myregistry.azurecr.io
   # Then push images
   docker push myregistry.azurecr.io/robot-backend:latest
   ```

---

## Getting More Help

### Enable Debug Logging

**Backend:**
```javascript
// backend/src/server.js
console.log = (...args) => process.stderr.write(new Date().toISOString() + ' ' + util.format(...args) + '\n');
```

**Frontend:**
```javascript
// frontend/src/main.jsx
window.DEBUG = true;
```

### Collect Diagnostic Info

```bash
# System info
uname -a
docker --version
node --version
npm --version

# Container logs
docker compose logs > logs.txt

# Port info
netstat -tuln

# Docker stats
docker stats --no-stream > stats.txt
```

### Report Issues

Create GitHub Issue with:
1. Problem description
2. Steps to reproduce
3. Expected vs actual behavior
4. Error messages
5. System info from above
6. Relevant logs

---

## Quick Recovery

### Nuclear Option - Start Fresh

```bash
# Remove everything
docker compose down -v
rm -rf backend/node_modules frontend/node_modules
rm -rf frontend/dist

# Rebuild
docker compose build --no-cache
npm install -C backend
npm install -C frontend

# Restart
docker compose up -d
```

### If All Else Fails

1. Close Docker Desktop completely
2. Restart computer
3. Open Docker Desktop
4. Run: `docker compose up -d`

---

**Still stuck?** Check [DEVELOPMENT.md](DEVELOPMENT.md) or create a GitHub Issue!
