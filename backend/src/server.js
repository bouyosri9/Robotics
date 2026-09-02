import express from "express";
import http from "http";
import cors from "cors";
import { WebSocketServer } from "ws";
import { RobotEngine } from "./robotEngine.js";
import { createRoutes } from "./routes.js";

const app = express();

// Origines autorisées pour le frontend, configurables par variable d'environnement
// (liste séparée par des virgules). Les valeurs par défaut couvrent le serveur de
// dev Vite (5173, et 5174 quand le port par défaut est déjà pris) ainsi que le
// frontend nginx servi par docker compose sur le port 8090.
//
// Une seule origine codée en dur suffisait à faire échouer silencieusement toutes
// les commandes : le WebSocket, lui, ne vérifie pas l'origine, donc l'interface
// affichait « Connected » pendant que chaque POST était bloqué par le navigateur.
const ALLOWED_ORIGINS = (process.env.FRONTEND_ORIGIN ||
  "http://localhost:5173,http://localhost:5174,http://localhost:8090")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Pas d'en-tête Origin : appels serveur à serveur, curl, health checks.
      if (!origin || ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      // Refus tracé côté serveur : sans ça, le blocage n'est visible nulle part.
      console.warn(
        `[cors] origine refusée: ${origin} — autorisées: ${ALLOWED_ORIGINS.join(", ")}. ` +
          "Ajoutez-la à FRONTEND_ORIGIN si c'est bien votre frontend."
      );
      return callback(null, false);
    },
  })
);
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

const engine = new RobotEngine();
app.use("/api", createRoutes(engine));

app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

wss.on("connection", (socket) => {
  console.log("[ws] client connecté");
  socket.send(JSON.stringify({ type: "state", payload: engine.getState() }));
  socket.on("close", () => console.log("[ws] client déconnecté"));
});

engine.onUpdate((state) => {
  const message = JSON.stringify({ type: "state", payload: state });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(message);
  });
});

engine.start();

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend robot-simulator à l'écoute sur le port ${PORT}`);
  console.log(`  Origines autorisées (CORS): ${ALLOWED_ORIGINS.join(", ")}`);
  console.log(`  REST:      http://localhost:${PORT}/api/state`);
  console.log(`  WebSocket: ws://localhost:${PORT}/ws`);
});
