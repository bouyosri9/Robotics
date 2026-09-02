import { Router } from "express";

const VALID_COMMANDS = ["start", "pause", "stop", "home"];

export function createRoutes(engine) {
  const router = Router();

  router.get("/state", (req, res) => {
    res.json(engine.getState());
  });

  router.post("/command", (req, res) => {
    const { command } = req.body;
    if (!VALID_COMMANDS.includes(command)) {
      return res.status(400).json({ error: `Commande invalide. Attendu: ${VALID_COMMANDS.join(", ")}` });
    }
    engine.setCommand(command);
    res.json({ ok: true, state: engine.getState() });
  });

  router.post("/joints", (req, res) => {
    const jointLimits = engine.getJointLimits();
    const target = {};

    for (const key of Object.keys(jointLimits)) {
      if (req.body[key] === undefined) continue;

      const value = req.body[key];
      if (typeof value !== "number" || Number.isNaN(value)) {
        return res.status(400).json({ error: `${key} doit être un nombre` });
      }

      const [min, max] = jointLimits[key];
      if (value < min || value > max) {
        return res.status(400).json({ error: `${key} hors limites : doit être entre ${min}° et ${max}°` });
      }

      target[key] = value;
    }

    if (Object.keys(target).length === 0) {
      return res.status(400).json({ error: "Aucun angle de joint valide fourni" });
    }

    engine.setTarget(target);
    res.json({ ok: true, state: engine.getState() });
  });

  router.post("/robot", (req, res) => {
    const robotConfig = req.body;
    if (!robotConfig || !Array.isArray(robotConfig.joints)) {
      return res.status(400).json({ error: "Configuration robot invalide" });
    }

    engine.setRobotConfig(robotConfig);
    res.json({ ok: true, state: engine.getState() });
  });

  return router;
}
