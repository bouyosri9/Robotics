# Robot Collaborative Simulator

A full-stack web application for simulating and supervising collaborative robots (cobots) from JAKA and Universal Robots. Experience real-time 3D visualization, forward kinematics calculations, and system monitoring in one integrated platform.

**Live Demo:** https://robot-nermine.duckdns.org/

## Features

✨ **Robot Catalog**
- Browse JAKA cobots (Zu series, Ai, MiniCobo, Lumi)
- Explore Universal Robots (UR3e, UR5e, UR10e, UR15)
- Detailed specifications: payload, reach, capabilities

🤖 **Real-Time Simulator**
- 3D visualization of robot position and movement
- 6-axis joint control (J1-J6) with angular sliders
- Forward kinematics TCP calculation
- Live animation with constant angular velocity

📊 **System Monitoring**
- Prometheus for metrics collection
- Grafana dashboards for visualization
- cAdvisor for container monitoring
- Health checks and uptime tracking

⚡ **Responsive Design**
- Dark-mode modern UI
- Works on desktop and tablet
- Real-time WebSocket updates (20 Hz)
- Sub-50ms API response times

## Quick Start

### With Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/robot-collaborative-simulator.git
cd robot-collaborative-simulator

# Start all services
docker compose up -d

# Access the application
open http://localhost:8090
```

All services start in ~10 seconds. Check status:
```bash
docker compose ps
```

### Local Development

**Backend:**
```bash
cd backend
npm install
npm run dev  # Server on http://localhost:4000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev  # UI on http://localhost:5173
```

## Services & Ports

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:8090 | Web application |
| **Backend API** | http://localhost:4000/api | REST API & WebSocket |
| **Prometheus** | http://localhost:9090 | Metrics database |
| **Grafana** | http://localhost:3001 | Dashboards (admin/changeme123) |
| **cAdvisor** | http://localhost:8080 | Container metrics |

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Web Browser (React 19)          │
│  - Robot Catalog                        │
│  - 3D Simulator with Three.js           │
│  - Joint Controls & Monitoring          │
└────────────────┬────────────────────────┘
                 │ WebSocket + REST API
         ┌───────▼────────┐
         │  Backend API   │
         │  (Express.js)  │
         │  Port 4000     │
         └───────┬────────┘
                 │
         ┌───────▼────────────────┐
         │   Robot Engine         │
         │ - Forward Kinematics   │
         │ - Joint Animation      │
         │ - State Management     │
         └────────────────────────┘
         
    Monitoring Stack:
    - Prometheus + Grafana + cAdvisor
```

## Technology Stack

### Frontend
- **React 19.2** - Modern UI framework
- **Three.js 0.185** - 3D visualization
- **Vite 8** - Lightning-fast build tool
- **Lucide React** - Icon library

### Backend
- **Node.js 20** - JavaScript runtime
- **Express.js 4.19** - Web framework
- **WebSocket (ws)** - Real-time communication
- **CORS** - Cross-origin request handling

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Service orchestration
- **Nginx** - Reverse proxy
- **Prometheus + Grafana** - Monitoring

## API Documentation

### REST Endpoints

```bash
# Get current robot state
GET /api/state

# Execute command (start, pause, stop, home)
POST /api/command
Body: {"command": "start"}

# Set target joint angles
POST /api/joints
Body: {"j1": 45, "j2": -60, "j3": 80, ...}

# Health check
GET /health
```

### WebSocket

```javascript
const ws = new WebSocket('ws://localhost:4000/ws');

ws.onmessage = (event) => {
  const state = JSON.parse(event.data);
  console.log('TCP Position:', state.payload.tcp);
  // state includes: joints, target, status, tcp, timestamp
};
```

**Full API documentation:** See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## Kinematics Model

**Forward Kinematics** (TCP Calculation)

```
Link Lengths:
- Base: 90 mm
- Upper Arm: 320 mm
- Forearm: 280 mm
- Wrist: 90 mm

TCP Position:
- Reach = upperArm·cos(J2) + forearm·cos(J2+J3)
- Height = base + upperArm·sin(J2) + forearm·sin(J2+J3)
- X = reach·sin(J1), Y = reach·cos(J1), Z = height
```

**Preset Poses:**
- HOME: (0°, -50°, 70°, -40°, 45°, 0°)
- DEMO: (35°, -70°, 100°, -60°, 60°, 25°)

**Joint Limits:**
| J1 | J2 | J3 | J4 | J5 | J6 |
|----|----|----|----|----|-----|
| ±180° | ±180° | ±170° | ±180° | ±180° | ±360° |

## Configuration

### Environment Variables

**Frontend (.env.production):**
```
VITE_API_URL=https://your-api.com/api
VITE_WS_URL=wss://your-api.com/ws
```

**Backend:**
```
PORT=4000
FRONTEND_ORIGIN=https://your-frontend.com
NODE_ENV=production
```

### Performance Specs

- **Update Frequency:** 20 Hz (50ms ticks)
- **Angular Velocity:** 1.2°/tick = 24°/second
- **API Response:** <50ms
- **WebSocket:** Real-time state broadcast

## Development

### Prerequisites
- Node.js v20+
- Docker & Docker Compose
- Git

### Quick Development Setup

```bash
# Clone and install
git clone <repo-url>
cd robot-collaborative-simulator

# Terminal 1: Backend
cd backend && npm install && npm run dev

# Terminal 2: Frontend  
cd frontend && npm install && npm run dev

# Terminal 3: Monitoring (optional)
docker compose up prometheus grafana cadvisor
```

Then:
- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- Prometheus: http://localhost:9090

### Making Changes

**Frontend changes:** Auto-reload via Vite
**Backend changes:** Auto-restart via `node --watch`

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed guide.

## Project Structure

```
robot-collaborative-simulator/
├── frontend/                   # React UI
│   ├── src/
│   │   ├── App.jsx            # Main app
│   │   ├── RobotCatalog.jsx   # Robot selection
│   │   ├── RobotSimulator.jsx # Simulation UI
│   │   ├── RobotCanvas.jsx    # 3D visualization
│   │   └── useRobotSocket.js  # WebSocket hook
│   └── Dockerfile
├── backend/                    # Node.js API
│   ├── src/
│   │   ├── server.js          # Express setup
│   │   ├── robotEngine.js     # Simulation logic
│   │   └── routes.js          # API endpoints
│   └── Dockerfile
├── docker-compose.yml         # Service orchestration
└── docs/
    ├── ARCHITECTURE.md        # System design
    ├── API_DOCUMENTATION.md   # API reference
    ├── INSTALLATION.md        # Setup guide
    ├── DEVELOPMENT.md         # Developer guide
    └── CONTRIBUTING.md        # Contribution rules
```

## Deployment

### Azure VM (Terraform)

```bash
cd terraform
terraform init
terraform plan
terraform apply

# Then SSH and deploy
ssh azureuser@<ip>
docker compose up -d
```

### Docker Hub

```bash
docker compose build --no-cache
docker tag robot-backend:latest myregistry/robot-backend:latest
docker push myregistry/robot-backend:latest
```

Full deployment guide: See [INSTALLATION.md](INSTALLATION.md)

## Troubleshooting

**WebSocket Connection Failed:**
```bash
# Check backend health
curl http://localhost:4000/health

# Verify URL in frontend env
echo $VITE_WS_URL
# Should be: ws://localhost:4000/ws
```

**Frontend shows old state:**
```bash
# Clear cache and rebuild
rm -rf frontend/node_modules frontend/dist
npm install -C frontend
npm run build -C frontend
```

**Port already in use:**
```bash
# Kill process on port 4000
lsof -i :4000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

See [INSTALLATION.md](INSTALLATION.md#troubleshooting) for more help.

## Roadmap

- [ ] Inverse Kinematics solver
- [ ] Complete joint limits for all axes
- [ ] Motion recording and playback
- [ ] Multi-robot collaboration scenarios
- [ ] Real hardware integration (actual robot controllers)
- [ ] Physics simulation (collision detection)
- [ ] Authentication and user management
- [ ] Mobile app version

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Nermine** - Cloud Computing Student, École Polytechnique Internationale (EPI), Tunis

Connect: [LinkedIn](https://linkedin.com/in/nermine) | [GitHub](https://github.com/nermine)

## Support

- 📖 [Documentation](.) - Full project docs
- 🐛 [Issues](../../issues) - Report bugs
- 💬 [Discussions](../../discussions) - Ask questions
- 📧 Email - Contact maintainers

## Acknowledgments

- JAKA Robotics for cobot specifications
- Universal Robots for UR series documentation
- The React and Three.js communities
- Open source contributors

---

**Made with ❤️ for robotics education and research**

[⬆ Back to top](#robot-collaborative-simulator)
