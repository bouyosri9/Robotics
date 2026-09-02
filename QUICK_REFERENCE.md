# Quick Reference Guide

## Getting Started (60 seconds)

```bash
git clone <repo>
cd robot-collaborative-simulator
docker compose up -d
# Wait 10 seconds, then open http://localhost:8090
```

## Common Commands

### Docker
```bash
docker compose up -d              # Start all services
docker compose down               # Stop all services
docker compose logs -f backend    # Watch backend logs
docker compose ps                 # Check status
docker compose restart backend    # Restart a service
```

### Local Development
```bash
cd backend && npm run dev         # Start backend with hot-reload (port 4000)
cd frontend && npm run dev        # Start frontend with hot-reload (port 5173)
npm run lint                      # Lint frontend code
```

### Testing
```bash
# Test API
curl http://localhost:4000/health
curl http://localhost:4000/api/state

# Test WebSocket
wscat -c ws://localhost:4000/ws

# Browser console WebSocket test
const ws = new WebSocket('ws://localhost:4000/ws');
ws.onmessage = e => console.log(JSON.parse(e.data));
```

## API Quick Reference

### REST Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/state` | Get current state |
| POST | `/api/command` | Send command (start/pause/stop/home) |
| POST | `/api/joints` | Set joint angles |
| GET | `/health` | Health check |

### WebSocket
```javascript
const ws = new WebSocket('ws://localhost:4000/ws');
ws.send(JSON.stringify({type: 'command', payload: 'start'})); // If needed
```

## State Object

```javascript
{
  joints: { j1, j2, j3, j4, j5, j6 },  // Current angles (degrees)
  target: { j1, j2, j3, j4, j5, j6 },  // Target angles
  status: "idle|running|paused",
  tcp: { x, y, z },                     // Tool position (mm)
  timestamp: 1693472400123
}
```

## Joint Limits

```
J1: -180° to 180°  (Base rotation)
J2: -180° to 180°  (Shoulder)
J3: -170° to 170°  (Elbow)
J4: -180° to 180°  (Wrist 1)
J5: -180° to 180°  (Wrist 2)
J6: -360° to 360°  (Wrist 3)
```

## Preset Poses

```
HOME: j1=0°, j2=-50°, j3=70°, j4=-40°, j5=45°, j6=0°
DEMO: j1=35°, j2=-70°, j3=100°, j4=-60°, j5=60°, j6=25°
```

## File Structure

```
backend/src/
  ├── server.js       ← Express app, WebSocket
  ├── robotEngine.js  ← Kinematics, simulation
  └── routes.js       ← API endpoints

frontend/src/
  ├── App.jsx              ← Main component
  ├── RobotCatalog.jsx     ← Robot selection
  ├── RobotSimulator.jsx   ← Controls
  ├── RobotCanvas.jsx      ← 3D rendering
  ├── useRobotSocket.js    ← WebSocket hook
  └── forwardKinematics.js ← Math
```

## Ports

```
8090  - Frontend (Nginx)
4000  - Backend API & WebSocket
9090  - Prometheus
3001  - Grafana (admin/changeme123)
8080  - cAdvisor
```

## Environment Variables

### Frontend
```
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=ws://localhost:4000/ws
```

### Backend
```
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
NODE_ENV=development
```

## Debugging

### Check if service is running
```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/state
curl http://localhost:8090
```

### View logs
```bash
docker compose logs backend
docker compose logs frontend
```

### Kill process on port
```bash
# Linux/Mac
lsof -i :4000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

## cURL Examples

```bash
# Get state
curl http://localhost:4000/api/state | jq

# Start motion
curl -X POST http://localhost:4000/api/command \
  -H "Content-Type: application/json" \
  -d '{"command":"start"}'

# Set joints to DEMO pose
curl -X POST http://localhost:4000/api/joints \
  -H "Content-Type: application/json" \
  -d '{"j1":35,"j2":-70,"j3":100,"j4":-60,"j5":60,"j6":25}'

# Move just J1
curl -X POST http://localhost:4000/api/joints \
  -H "Content-Type: application/json" \
  -d '{"j1":90}'
```

## Code Examples

### JavaScript - Fetch API
```javascript
const state = await fetch('http://localhost:4000/api/state')
  .then(r => r.json());

await fetch('http://localhost:4000/api/command', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ command: 'start' })
});
```

### Python
```python
import requests
import json

# Get state
r = requests.get('http://localhost:4000/api/state')
state = r.json()
print(f"TCP: {state['tcp']}")

# Set joints
requests.post('http://localhost:4000/api/joints', json={
    'j1': 45, 'j2': -60, 'j3': 80
})
```

### Node.js
```javascript
const axios = require('axios');

const state = await axios.get('http://localhost:4000/api/state');
console.log(state.data.tcp);

await axios.post('http://localhost:4000/api/joints', {
  j1: 45, j2: -60, j3: 80
});
```

## Performance Specs

- **Update Frequency:** 20 Hz (50ms/tick)
- **Angular Speed:** 24°/second
- **API Response:** <50ms
- **Motion Time:** Typically 5-50 seconds depending on angle difference
- **TCP Precision:** ±0.1mm

## Useful Links

| Resource | URL |
|----------|-----|
| Frontend Live | http://localhost:8090 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |
| cAdvisor | http://localhost:8080 |
| API Health | http://localhost:4000/health |

## Key Files to Edit

| File | Purpose | Edit For |
|------|---------|----------|
| `backend/src/robotEngine.js` | Simulation logic | Motion speed, kinematics |
| `backend/src/routes.js` | API endpoints | New API routes, validation |
| `frontend/src/RobotCatalog.jsx` | Robot catalog | New robot models |
| `frontend/src/RobotSimulator.jsx` | UI controls | New buttons, controls |
| `frontend/src/RobotCanvas.jsx` | 3D rendering | Visual representation |
| `docker-compose.yml` | Services | Port mapping, image versions |

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| WebSocket "Connection refused" | Ensure backend is running: `curl http://localhost:4000/health` |
| Port already in use | Kill process: `lsof -i :4000 \| awk '{print $2}' \| xargs kill -9` |
| Frontend shows old state | Clear cache: `rm -rf frontend/dist && npm run build -C frontend` |
| Changes not appearing | Restart service: `docker compose restart <service>` |
| Out of memory | Increase Docker resources: Docker Desktop → Settings → Resources |

## Documentation Files

- **[README_EN.md](README_EN.md)** - Project overview (English)
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design & components
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference
- **[INSTALLATION.md](INSTALLATION.md)** - Setup & deployment guide
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Developer guide
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - This file

## Need Help?

1. Check [INSTALLATION.md](INSTALLATION.md#troubleshooting) for common issues
2. Read [DEVELOPMENT.md](DEVELOPMENT.md) for technical details
3. See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for API reference
4. Search [GitHub Issues](../../issues)
5. Create a GitHub Discussion for questions

---

**Last Updated:** 2024
