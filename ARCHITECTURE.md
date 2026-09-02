# Architecture Documentation

## Project Overview

The **Robot Collaborative Simulator** is a full-stack web application for simulating and supervising collaborative robots (cobots) from JAKA and Universal Robots. It provides real-time 3D visualization, joint control via forward kinematics, and system monitoring through Prometheus/Grafana.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Users (Web Browser)                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        │         ┌────────▼────────┐         │
        │         │    Nginx 1.27   │         │
        │         │  (Reverse Proxy)│         │
        │         │   Port 8090     │         │
        │         └────────┬────────┘         │
        │                  │                  │
    ┌───▼──────────┐  ┌────▼────────────┐   │
    │   Frontend   │  │   REST API      │   │
    │   (React19)  │  │  & WebSocket    │   │
    │              │  │  (Node.js)      │   │
    │ • Catalog    │  │  Port 4000      │   │
    │ • Simulator  │  │                 │   │
    │ • 3D Canvas  │  │ • /api/state    │   │
    │ • Controls   │  │ • /api/command  │   │
    │              │  │ • /api/joints   │   │
    │              │  │ • /ws           │   │
    └──────────────┘  └────┬────────────┘   │
                           │                 │
                ┌──────────▼──────────┐     │
                │   RobotEngine       │     │
                │  (Simulation Logic) │     │
                │                     │     │
                │ • Forward Kinematics│     │
                │ • Joint Animation   │     │
                │ • State Management  │     │
                └─────────────────────┘     │
                                             │
        ┌────────────────────────────────────┘
        │
    ┌───▼──────────────────┐
    │   Monitoring Stack   │
    │                      │
    │ • Prometheus (9090)  │
    │ • Grafana (3001)     │
    │ • cAdvisor (8080)    │
    └──────────────────────┘
```

## Component Details

### Frontend (React 19)

**Location:** `frontend/src/`

**Key Files:**
- `App.jsx` - Main app routing (catalog → simulator)
- `RobotCatalog.jsx` - Robot selection interface
- `RobotSimulator.jsx` - 3D simulation and control panel
- `RobotCanvas.jsx` - Three.js 3D rendering
- `useRobotSocket.js` - WebSocket connection hook
- `forwardKinematics.js` - TCP position calculations

**Technologies:**
- React 19.2.7 - UI framework
- Three.js 0.185.1 - 3D rendering
- Vite 8.1.1 - Build tool
- Lucide React 1.23.0 - Icon library

**Features:**
- Robot catalog with detailed specifications
- Real-time 3D visualization of robot position and TCP
- Joint angle sliders (J1-J6)
- Motion control buttons (Start/Pause/Stop/Home)
- Live state updates via WebSocket
- Responsive dark-mode UI

### Backend (Node.js/Express)

**Location:** `backend/src/`

**Key Files:**
- `server.js` - Express app, WebSocket setup, CORS configuration
- `robotEngine.js` - Core simulation logic, kinematics, state management
- `routes.js` - REST API endpoints with input validation

**Technologies:**
- Node.js 20 (Alpine)
- Express 4.19.2 - Web framework
- ws 8.17.0 - WebSocket server
- CORS 2.8.5 - Cross-origin request handling

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|---|
| GET | `/api/state` | Current robot state (joints, TCP, status) |
| POST | `/api/command` | Control commands (start/pause/stop/home) |
| POST | `/api/joints` | Set target joint angles (with validation) |
| GET | `/health` | Health check endpoint |
| WS | `/ws` | WebSocket connection for real-time state updates |

**Key Classes:**

**RobotEngine**
- Manages robot simulation state
- Implements constant angular velocity motion
- Computes TCP (Tool Center Point) via forward kinematics
- Broadcasts state updates to connected clients

```
State Structure:
{
  joints: { j1, j2, j3, j4, j5, j6 },    // Current angles (degrees)
  target: { j1, j2, j3, j4, j5, j6 },    // Target angles
  status: "idle" | "running" | "paused",
  connected: boolean,
  tcp: { x, y, z },                       // Tool position (mm)
  timestamp: number
}
```

### Kinematics Model

**Forward Kinematics (TCP Calculation)**

The TCP position is calculated from joint angles using link lengths:

```
LINKS:
- base: 90 mm
- upperArm: 320 mm
- forearm: 280 mm
- wrist: 90 mm

Calculation:
- J1: Rotation around Z-axis (horizontal plane)
- J2, J3: Control vertical reach and height
- Reach = upperArm·cos(J2) + forearm·cos(J2+J3)
- Height = base + upperArm·sin(J2) + forearm·sin(J2+J3)
- TCP(x,y,z) = (reach·sin(J1), reach·cos(J1), height)
```

**Preset Poses:**

| Pose | J1 | J2 | J3 | J4 | J5 | J6 |
|------|----|----|----|----|----|----|
| HOME | 0° | -50° | 70° | -40° | 45° | 0° |
| DEMO | 35° | -70° | 100° | -60° | 60° | 25° |

### Infrastructure & Deployment

**Docker Services:**

1. **Backend** (robot-backend)
   - Node.js server
   - Port: 4000
   - Healthcheck: /health endpoint
   - Multi-stage build (deps → runner)

2. **Frontend** (robot-frontend)
   - Nginx serving static assets
   - Port: 8090 (mapped from 80)
   - Vite-built React app

3. **Prometheus**
   - Metrics scraping
   - Port: 9090
   - Config: `prometheus.yml`
   - Scrapes backend, cAdvisor

4. **Grafana**
   - Dashboard visualization
   - Port: 3001
   - Default admin: changeme123

5. **cAdvisor**
   - Container metrics
   - Port: 8080
   - Monitors CPU, memory, I/O

## Communication Flow

### REST API Flow
```
1. User adjusts slider → Frontend state update
2. Frontend POST /api/joints with new angles
3. Backend validates limits and updates RobotEngine target
4. Engine begins animating joints toward target
5. WebSocket broadcasts state updates to all clients
6. Frontend receives state, updates 3D display
```

### WebSocket Flow
```
1. Client connects → receives current state snapshot
2. RobotEngine updates state every 50ms
3. Backend broadcasts to all connected clients
4. Frontend updates display in real-time
```

## Data Flow Diagram

```
User Input (UI Sliders/Buttons)
          ↓
    Frontend React
     ↓         ↓
  REST API  WebSocket
     ↓         ↓
  Backend Routes  (state broadcasts)
     ↓         ↓
  RobotEngine   ←→ WebSocket Server
     ↓
  Forward Kinematics (TCP)
     ↓
  State Emission
     ↓
  3D Visualization Update
```

## Joint Limits

| Joint | Min | Max | Range |
|-------|-----|-----|-------|
| J1 (Base) | -180° | 180° | 360° |
| J2 (Shoulder) | -180° | 180° | 360° |
| J3 (Elbow) | -170° | 170° | 340° |
| J4 (Wrist Rot1) | -180° | 180° | 360° |
| J5 (Wrist Rot2) | -180° | 180° | 360° |
| J6 (Wrist Rot3) | -360° | 360° | 720° |

## Performance Specifications

- **Update Frequency:** 20 Hz (50ms tick interval)
- **Angular Velocity:** 1.2°/tick = 24°/second (constant)
- **Time to Position:** Depends on angle differences (~5-50 seconds typical)
- **WebSocket Broadcasting:** All connected clients updated per tick
- **API Response Time:** <50ms for joint commands
- **Forward Kinematics:** Sub-millisecond computation

## Environment Variables

**Frontend (`VITE_*`):**
- `VITE_API_URL` - Backend API base URL (default: `http://localhost:4000/api`)
- `VITE_WS_URL` - WebSocket URL (default: `ws://localhost:4000/ws`)

**Backend:**
- `PORT` - Server port (default: 4000)
- `FRONTEND_ORIGIN` - CORS allowed origin (default: `http://localhost:5173`)
- `NODE_ENV` - Production/development mode

## Security Considerations

1. **Input Validation:**
   - All joint angles validated against physical limits
   - Command enum validation (start/pause/stop/home)
   - Numeric type checking on API requests

2. **CORS:**
   - Configurable via `FRONTEND_ORIGIN` env variable
   - Restricts cross-origin requests to frontend origin

3. **WebSocket:**
   - No authentication (add JWT if needed)
   - Message parsing with error handling
   - Client list cleanup on disconnect

## Scalability Considerations

- **Single Robot Simulation:** Current design simulates one robot
- **Multiple Clients:** Architecture supports many simultaneous WebSocket connections
- **Multi-Robot:** Would require:
  - Multiple RobotEngine instances
  - Namespace/room-based WebSocket routing
  - Separate API routes per robot
  - Extended monitoring metrics

## Roadmap & Future Enhancements

1. **Inverse Kinematics** - Allow targeting TCP position directly
2. **Joint Limits** - Complete limits for all axes
3. **Motion Recording** - Save and replay motion sequences
4. **Multi-Robot Scenarios** - Simulation of robot collaboration
5. **Physics Simulation** - Collision detection, gravity
6. **Real Hardware Integration** - Connect to actual robot controllers
