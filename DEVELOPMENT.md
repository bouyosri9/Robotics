# Development Guide

## Project Structure

```
robot-collaborative-simulator/
├── backend/
│   ├── src/
│   │   ├── server.js           # Express app & WebSocket setup
│   │   ├── robotEngine.js      # Core simulation logic
│   │   └── routes.js           # REST API endpoints
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.jsx            # React entry point
│   │   ├── App.jsx             # Main app component
│   │   ├── RobotCatalog.jsx    # Robot selection UI
│   │   ├── RobotSimulator.jsx  # Simulation controls
│   │   ├── RobotCanvas.jsx     # Three.js 3D rendering
│   │   ├── useRobotSocket.js   # WebSocket hook
│   │   ├── forwardKinematics.js # Kinematics calculations
│   │   ├── components/         # Reusable components
│   │   ├── assets/             # Images, icons
│   │   └── index.css           # Global styles
│   ├── public/
│   ├── Dockerfile
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml
├── prometheus.yml
├── Dockerfile
├── ARCHITECTURE.md             # System design documentation
├── API_DOCUMENTATION.md        # API reference
├── INSTALLATION.md             # Setup guide
├── DEVELOPMENT.md              # This file
├── CONTRIBUTING.md             # Contribution guidelines
└── README.md                   # Project overview
```

## Development Workflow

### 1. Setup Local Development Environment

```bash
# Clone and enter directory
git clone <repo-url>
cd robot-collaborative-simulator

# Backend setup
cd backend
npm install
npm run dev  # Starts on port 4000

# In another terminal: Frontend setup
cd frontend
npm install
npm run dev  # Starts on port 5173
```

Browser opens to `http://localhost:5173` with hot-reload enabled.

### 2. Code Style & Conventions

**JavaScript:**
- ES6+ modules
- Prefer `const` over `let` or `var`
- Use arrow functions for callbacks
- Use destructuring for objects/arrays

**React:**
- Functional components with hooks
- Use `useState` for local state
- Use custom hooks for reusable logic
- Prop validation not enforced (could add PropTypes)

**File Naming:**
- Components: PascalCase (RobotSimulator.jsx)
- Hooks: camelCase with "use" prefix (useRobotSocket.js)
- Utilities: camelCase (forwardKinematics.js)

**Formatting:**
```bash
# Frontend linting
cd frontend
npm run lint
```

### 3. Making Changes

#### Adding a New Backend API Endpoint

**File:** `backend/src/routes.js`

```javascript
export function createRoutes(engine) {
  const router = Router();
  
  // Existing routes...
  
  // New endpoint
  router.get("/position", (req, res) => {
    const tcp = engine.computeTcp();
    res.json({ 
      position: tcp,
      reachable: isReachable(tcp)
    });
  });
  
  return router;
}
```

Then test:
```bash
curl http://localhost:4000/api/position
```

#### Modifying Robot Engine Logic

**File:** `backend/src/robotEngine.js`

Example: Change motion speed

```javascript
const SPEED_DEG_PER_TICK = 1.2; // Change this value (degrees per 50ms)

// Current: 1.2°/tick = 24°/second
// If you want 30°/second: 1.5°/tick
```

The tick() method is called every 50ms:
```javascript
tick() {
  if (this.status === "running") {
    let reached = true;
    const next = { ...this.joints };
    JOINT_KEYS.forEach((key) => {
      const diff = this.target[key] - this.joints[key];
      if (Math.abs(diff) > SPEED_DEG_PER_TICK) {
        next[key] += Math.sign(diff) * SPEED_DEG_PER_TICK;
        reached = false;
      } else {
        next[key] = this.target[key];
      }
    });
    this.joints = next;
    if (reached) this.status = "idle";
  }
  this.emit();
}
```

#### Creating a New Frontend Component

**File:** `frontend/src/components/NewComponent.jsx`

```jsx
import React, { useState } from 'react';
import { useRobotSocket } from '../useRobotSocket';

export default function NewComponent() {
  const { state, sendCommand } = useRobotSocket();
  const [localState, setLocalState] = useState(null);
  
  if (!state) return <div>Loading...</div>;
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

Import in App.jsx:
```jsx
import NewComponent from './components/NewComponent';
```

#### Updating Robot Catalog

**File:** `frontend/src/RobotCatalog.jsx`

Add new robot model to `BRANDS` object:
```javascript
const BRANDS = {
  jaka: {
    // ... existing data
    models: [
      // ... existing models
      {
        name: "New Model",
        line: "New Line",
        payload: 10,
        reach: 1200,
        badge: "New",
        detail: "Description",
        icon: IconComponent,
        featured: false
      }
    ]
  }
}
```

### 4. Debugging

#### Backend Debugging

**Enable verbose logging:**

```javascript
// backend/src/server.js
console.log('[ws] client connecté');
console.log('[robot] State:', engine.getState());
```

**Check logs:**
```bash
npm run dev  # See console output
# Or with Docker
docker compose logs -f backend
```

**Debug incoming requests:**
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

#### Frontend Debugging

**Browser DevTools:**
- Open DevTools (F12)
- Network tab: See API calls, WebSocket messages
- Console: Errors, logs
- Application tab: Check localStorage, cookies

**React DevTools Extension:**
```bash
# Install in Chrome/Firefox
# Enables component inspection, state tracking
```

**Check WebSocket connection:**
```javascript
// In browser console
const ws = new WebSocket('ws://localhost:4000/ws');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

### 5. Testing

#### Manual Testing Checklist

- [ ] Frontend loads without console errors
- [ ] Robot catalog displays all models
- [ ] Selecting robot loads simulator
- [ ] WebSocket connects and updates state in real-time
- [ ] Joint sliders update robot position
- [ ] Start/Pause/Stop buttons work
- [ ] Home button returns to home pose
- [ ] TCP position updates accurately
- [ ] Refreshing page maintains connection
- [ ] Mobile responsiveness works

#### API Testing

**Using Postman or curl:**

```bash
# Test all endpoints
curl http://localhost:4000/api/state
curl http://localhost:4000/health
curl -X POST http://localhost:4000/api/command -H "Content-Type: application/json" -d '{"command":"start"}'
curl -X POST http://localhost:4000/api/joints -H "Content-Type: application/json" -d '{"j1":45}'
```

**WebSocket Testing:**
```javascript
// Browser console
const ws = new WebSocket('ws://localhost:4000/ws');
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  console.log('Updates per second:', msg.payload.timestamp);
};
```

### 6. Performance Optimization

#### Frontend Optimization

**Reduce re-renders:**
```javascript
// Use useMemo for expensive calculations
const memoizedValue = useMemo(() => {
  return calculateTCPPath(state.joints);
}, [state.joints]);

// Use useCallback for stable function references
const handleJointChange = useCallback((joint, value) => {
  setTarget(prev => ({ ...prev, [joint]: value }));
}, []);
```

**Three.js Performance:**
- Limit update frequency to 60fps
- Use geometry/material caching
- Reduce triangle count for simpler models
- Optimize lighting and shadows

#### Backend Optimization

**Reduce computation:**
```javascript
// Cache kinematics calculations
const tcpCache = new Map();

computeTcp() {
  const key = JSON.stringify(this.joints);
  if (tcpCache.has(key)) return tcpCache.get(key);
  
  const tcp = /* calculation */;
  tcpCache.set(key, tcp);
  return tcp;
}
```

**Optimize WebSocket broadcasting:**
```javascript
// Only send diffs instead of full state
const sendDiff = (oldState, newState) => {
  const diff = {};
  if (!stateEqual(oldState.joints, newState.joints)) {
    diff.joints = newState.joints;
  }
  // ... more diffs
};
```

### 7. Environment Configuration

**Frontend (.env.development):**
```
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=ws://localhost:4000/ws
```

**Frontend (.env.production):**
```
VITE_API_URL=https://robot.example.com/api
VITE_WS_URL=wss://robot.example.com/ws
```

**Backend (.env):**
```
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### 8. Git Workflow

**Create feature branch:**
```bash
git checkout -b feature/inverse-kinematics
```

**Commit frequently:**
```bash
git commit -m "feat: add inverse kinematics solver"
```

**Push and create PR:**
```bash
git push origin feature/inverse-kinematics
```

**PR checklist:**
- [ ] Tests pass
- [ ] Linting passes
- [ ] Documentation updated
- [ ] No console errors

## Common Tasks

### Add Joint Limits Validation

**File:** `backend/src/routes.js`

```javascript
const JOINT_LIMITS = {
  j1: [-180, 180],
  j2: [-180, 180],
  j3: [-170, 170],  // More restrictive
  j4: [-180, 180],
  j5: [-180, 180],
  j6: [-360, 360],
};

// The validation already exists - just modify limits as needed
```

### Implement Inverse Kinematics

**File:** `backend/src/robotEngine.js`

```javascript
// Add IK solver (complex algorithm)
solveInverseKinematics(targetTcp) {
  // Using numerical methods or analytical solution
  // Return joint angles that reach the target TCP
  const { x, y, z } = targetTcp;
  
  // Calculate using JAKA specifications
  // This is a placeholder
  return { j1: 0, j2: -50, j3: 70, j4: -40, j5: 45, j6: 0 };
}
```

### Add Motion Recording

**File:** `backend/src/robotEngine.js`

```javascript
class RobotEngine {
  constructor() {
    // ... existing code
    this.motionRecording = [];
    this.isRecording = false;
  }
  
  startRecording() {
    this.motionRecording = [];
    this.isRecording = true;
  }
  
  stopRecording() {
    this.isRecording = false;
    return this.motionRecording;
  }
  
  tick() {
    // ... existing tick logic
    
    if (this.isRecording) {
      this.motionRecording.push({
        timestamp: Date.now(),
        joints: { ...this.joints },
        tcp: this.computeTcp()
      });
    }
  }
}
```

### Add Real Robot Connection

```javascript
// backend/src/robotConnection.js
class RealRobotConnection {
  async connect(robotIp) {
    this.socket = net.createConnection(robotIp, 5000);
    this.socket.on('data', (data) => this.handleRobotUpdate(data));
  }
  
  async moveJoints(angles) {
    const command = this.encodeMotionCommand(angles);
    this.socket.write(command);
  }
  
  handleRobotUpdate(data) {
    const robotState = this.decodeRobotState(data);
    this.emit('update', robotState);
  }
}
```

## Dependencies Management

### Adding Dependencies

**Frontend:**
```bash
cd frontend
npm install new-package
npm run build  # Test build
```

**Backend:**
```bash
cd backend
npm install new-package
npm start  # Test run
```

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update all
npm update

# Update specific package
npm install package@latest
```

## Monitoring & Metrics

### Add Application Metrics

**File:** `backend/src/server.js`

```javascript
let requestCount = 0;
let wsConnections = 0;

app.use((req, res, next) => {
  requestCount++;
  next();
});

app.get('/metrics', (req, res) => {
  res.send(`
# HELP robot_requests_total Total HTTP requests
# TYPE robot_requests_total counter
robot_requests_total ${requestCount}

# HELP robot_ws_connections Current WebSocket connections
# TYPE robot_ws_connections gauge
robot_ws_connections ${wsConnections}
  `);
});

wss.on('connection', () => {
  wsConnections++;
});
```

### View Prometheus Metrics

Navigate to `http://localhost:9090` and query:
```
robot_ws_connections
robot_requests_total
container_memory_usage_bytes
```

## Troubleshooting

### Port Already in Use

```bash
# Linux/Mac
lsof -i :4000
kill -9 <PID>

# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

### WebSocket Connection Failed

Check backend is running:
```bash
ps aux | grep node
curl http://localhost:4000/health
```

Check frontend config:
```bash
echo $VITE_WS_URL  # Should be ws://localhost:4000/ws
```

### React Hot Reload Not Working

```bash
# Restart Vite
npm run dev

# Clear cache
rm -rf node_modules .vite
npm install
npm run dev
```

### Docker Build Fails

```bash
# Clean and rebuild
docker compose down -v
docker compose build --no-cache
docker compose up -d
docker compose logs
```

## Resources

- [React Docs](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [Three.js Documentation](https://threejs.org/docs)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Vite Documentation](https://vitejs.dev)

## Questions?

Check [CONTRIBUTING.md](CONTRIBUTING.md) for how to get help or report issues.
