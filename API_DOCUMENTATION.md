# API Documentation

## Overview

The Robot Simulator API provides two communication channels:

1. **REST API** - Stateless request/response operations
2. **WebSocket API** - Real-time bidirectional state updates

**Base URLs:**
- REST: `http://localhost:4000/api`
- WebSocket: `ws://localhost:4000/ws`

## REST API Endpoints

### Get Robot State

**Endpoint:** `GET /api/state`

Returns the current state of the robot simulation.

**Response:**
```json
{
  "joints": {
    "j1": 0,
    "j2": -50,
    "j3": 70,
    "j4": -40,
    "j5": 45,
    "j6": 0
  },
  "target": {
    "j1": 0,
    "j2": -50,
    "j3": 70,
    "j4": -40,
    "j5": 45,
    "j6": 0
  },
  "status": "idle",
  "connected": true,
  "tcp": {
    "x": 0,
    "y": 623.2,
    "z": 590.1
  },
  "timestamp": 1693472400123
}
```

**Status Codes:**
- `200 OK` - Success

**Example:**
```bash
curl http://localhost:4000/api/state
```

---

### Execute Command

**Endpoint:** `POST /api/command`

Send a command to control the robot motion.

**Request Body:**
```json
{
  "command": "start|pause|stop|home"
}
```

**Valid Commands:**

| Command | Description |
|---------|---|
| `start` | Begin motion to target pose. If already at target, toggle between HOME and DEMO poses. |
| `pause` | Pause current motion. Joints freeze at current position. |
| `stop` | Stop all motion and clear target (same as current position). |
| `home` | Move to HOME pose (j1:0, j2:-50, j3:70, j4:-40, j5:45, j6:0). |

**Response:**
```json
{
  "ok": true,
  "state": {
    "joints": {...},
    "target": {...},
    "status": "running",
    "tcp": {...},
    "timestamp": 1693472400200
  }
}
```

**Error Response:**
```json
{
  "error": "Commande invalide. Attendu: start, pause, stop, home"
}
```

**Status Codes:**
- `200 OK` - Command executed
- `400 Bad Request` - Invalid command

**Examples:**
```bash
# Start motion
curl -X POST http://localhost:4000/api/command \
  -H "Content-Type: application/json" \
  -d '{"command": "start"}'

# Pause motion
curl -X POST http://localhost:4000/api/command \
  -H "Content-Type: application/json" \
  -d '{"command": "pause"}'

# Return to home position
curl -X POST http://localhost:4000/api/command \
  -H "Content-Type: application/json" \
  -d '{"command": "home"}'
```

---

### Set Joint Angles

**Endpoint:** `POST /api/joints`

Set target joint angles. The robot will animate to these positions.

**Request Body:**
```json
{
  "j1": 35,
  "j2": -70,
  "j3": 100,
  "j4": -60,
  "j5": 60,
  "j6": 25
}
```

**Parameters:**

| Joint | Type | Range | Description |
|-------|------|-------|---|
| j1 | number | -180 to 180 | Base rotation (horizontal plane) |
| j2 | number | -180 to 180 | Shoulder (vertical reach up/down) |
| j3 | number | -170 to 170 | Elbow (forearm extension) |
| j4 | number | -180 to 180 | Wrist rotation 1 |
| j5 | number | -180 to 180 | Wrist rotation 2 |
| j6 | number | -360 to 360 | Wrist rotation 3 (extended range) |

**All parameters are optional** - only specified joints will be updated.

**Response:**
```json
{
  "ok": true,
  "state": {
    "joints": {...},
    "target": {...},
    "status": "running",
    "tcp": {...},
    "timestamp": 1693472400300
  }
}
```

**Error Responses:**

Invalid type:
```json
{
  "error": "j2 doit être un nombre"
}
```

Out of limits:
```json
{
  "error": "j1 hors limites : doit être entre -180° et 180°"
}
```

No valid joints provided:
```json
{
  "error": "Aucun angle de joint valide fourni"
}
```

**Status Codes:**
- `200 OK` - Joints updated
- `400 Bad Request` - Validation error

**Examples:**
```bash
# Set all joints to DEMO pose
curl -X POST http://localhost:4000/api/joints \
  -H "Content-Type: application/json" \
  -d '{
    "j1": 35,
    "j2": -70,
    "j3": 100,
    "j4": -60,
    "j5": 60,
    "j6": 25
  }'

# Move just J1 (base rotation)
curl -X POST http://localhost:4000/api/joints \
  -H "Content-Type: application/json" \
  -d '{"j1": 90}'

# Move multiple joints
curl -X POST http://localhost:4000/api/joints \
  -H "Content-Type: application/json" \
  -d '{"j2": 0, "j3": 50}'
```

---

### Health Check

**Endpoint:** `GET /health`

Server health status and uptime.

**Response:**
```json
{
  "status": "ok",
  "uptime": 3600.234
}
```

**Status Codes:**
- `200 OK` - Server healthy

**Example:**
```bash
curl http://localhost:4000/health
```

---

## WebSocket API

### Connection

**URL:** `ws://localhost:4000/ws`

Upgrade to WebSocket connection.

**JavaScript Example:**
```javascript
const ws = new WebSocket('ws://localhost:4000/ws');

ws.onopen = () => {
  console.log('Connected');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

### Message Format

All WebSocket messages are JSON objects with type and payload:

```json
{
  "type": "state",
  "payload": {
    "joints": {...},
    "target": {...},
    "status": "idle",
    "tcp": {...},
    "timestamp": 1693472400123
  }
}
```

### Server → Client Messages

#### State Update

**Type:** `state`

Sent every 50ms with updated robot state.

**Message:**
```json
{
  "type": "state",
  "payload": {
    "joints": {
      "j1": 0,
      "j2": -50,
      "j3": 70,
      "j4": -40,
      "j5": 45,
      "j6": 0
    },
    "target": {
      "j1": 35,
      "j2": -70,
      "j3": 100,
      "j4": -60,
      "j5": 60,
      "j6": 25
    },
    "status": "running",
    "connected": true,
    "tcp": {
      "x": 12.5,
      "y": 620.3,
      "z": 540.2
    },
    "timestamp": 1693472400123
  }
}
```

**Frequency:** 20 Hz (every 50ms)

---

## Data Types

### Joint Angles Object

```typescript
interface JointAngles {
  j1: number;  // degrees, -180 to 180
  j2: number;  // degrees, -180 to 180
  j3: number;  // degrees, -170 to 170
  j4: number;  // degrees, -180 to 180
  j5: number;  // degrees, -180 to 180
  j6: number;  // degrees, -360 to 360
}
```

### TCP Position

```typescript
interface TCPPosition {
  x: number;  // mm, horizontal offset
  y: number;  // mm, horizontal offset
  z: number;  // mm, vertical height from base
}
```

### Robot State

```typescript
interface RobotState {
  joints: JointAngles;
  target: JointAngles;
  status: "idle" | "running" | "paused";
  connected: boolean;
  tcp: TCPPosition;
  timestamp: number;  // milliseconds since epoch
}
```

---

## CORS

**Allowed Origin:** Configurable via `FRONTEND_ORIGIN` environment variable

Default: `http://localhost:5173` (Vite dev server)

**Headers:**
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## Rate Limiting

Currently **not implemented**. Consider adding in production:

```javascript
// Example express-rate-limit middleware
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100  // 100 requests per window
});

app.use('/api/', limiter);
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Description of what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 500 | Server Error |

---

## Examples

### Python Client

```python
import json
import requests
import websocket

# REST API
api_base = 'http://localhost:4000/api'

# Get state
response = requests.get(f'{api_base}/state')
state = response.json()
print(f"Current position: {state['tcp']}")

# Set joints
response = requests.post(f'{api_base}/joints', json={
    'j1': 45,
    'j2': -60,
    'j3': 80
})

# Execute command
response = requests.post(f'{api_base}/command', json={
    'command': 'start'
})

# WebSocket
ws = websocket.WebSocketApp('ws://localhost:4000/ws')

def on_message(ws, message):
    data = json.loads(message)
    print(f"TCP: {data['payload']['tcp']}")

ws.on_message = on_message
ws.run_forever()
```

### JavaScript / Node.js

```javascript
const axios = require('axios');
const WebSocket = require('ws');

const API_BASE = 'http://localhost:4000/api';
const WS_URL = 'ws://localhost:4000/ws';

// REST API
async function getState() {
  const response = await axios.get(`${API_BASE}/state`);
  return response.data;
}

async function setJoints(joints) {
  const response = await axios.post(`${API_BASE}/joints`, joints);
  return response.data;
}

async function executeCommand(command) {
  const response = await axios.post(`${API_BASE}/command`, { command });
  return response.data;
}

// WebSocket
const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('Connected');
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('State:', message.payload);
});

// Usage
(async () => {
  const state = await getState();
  console.log('TCP:', state.tcp);
  
  await setJoints({ j1: 30, j2: -60 });
  await executeCommand('start');
})();
```

### cURL Examples

```bash
# Get state
curl http://localhost:4000/api/state

# Set joints
curl -X POST http://localhost:4000/api/joints \
  -H "Content-Type: application/json" \
  -d '{"j1": 45, "j2": -60, "j3": 80}'

# Execute command
curl -X POST http://localhost:4000/api/command \
  -H "Content-Type: application/json" \
  -d '{"command": "start"}'

# Health check
curl http://localhost:4000/health
```

---

## Performance Metrics

- **Response Time:** <50ms for REST API
- **WebSocket Update Frequency:** 20 Hz (50ms interval)
- **TCP Calculation:** <1ms
- **Kinematics Accuracy:** ±0.1mm for standard poses

---

## Future Enhancements

- [ ] Authentication/Authorization (JWT tokens)
- [ ] Rate limiting per IP
- [ ] Request validation middleware
- [ ] API versioning (/api/v1)
- [ ] Bulk command queuing
- [ ] Motion recording/playback API
- [ ] Inverse kinematics endpoint
- [ ] Collision detection feedback
