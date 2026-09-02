import { useEffect, useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:4000/ws";

/**
 * Envoie une commande REST et distingue les deux natures d'échec, parce que
 * l'interface doit y réagir différemment :
 *
 *  - { ok: true }                    le backend a accepté.
 *  - { ok: false, rejected: true }   le backend a répondu et refusé (angle hors
 *                                    limites…). Sa valeur fait foi.
 *  - { ok: false, rejected: false }  le backend est injoignable : arrêté, ou
 *                                    origine bloquée par CORS. L'interface reste
 *                                    utilisable en simulation locale.
 *
 * Avant, tout échec finissait dans un console.error : le simulateur semblait
 * simplement ignorer les curseurs, sans rien afficher.
 */
async function postJson(path, body) {
  let response;
  try {
    response = await fetch(API_BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return { ok: false, rejected: false, error: `Backend injoignable : ${err.message}` };
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {
      // Réponse non JSON : on conserve le code HTTP comme message.
    }
    return { ok: false, rejected: true, error: message };
  }

  return { ok: true };
}

export function useRobotSocket() {
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastError, setLastError] = useState(null);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onerror = () => setConnected(false);
    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "state") setState(msg.payload);
      } catch (err) {
        console.error("Message WebSocket invalide:", err);
      }
    };

    return () => socket.close();
  }, []);

  const send = useCallback(async (path, body) => {
    const result = await postJson(path, body);
    setLastError(result.ok ? null : result.error);
    return result;
  }, []);

  const sendCommand = useCallback((command) => send("/command", { command }), [send]);
  const sendJoints = useCallback((joints) => send("/joints", joints), [send]);
  const sendRobotConfig = useCallback((robot) => send("/robot", robot), [send]);

  return { state, connected, lastError, sendCommand, sendJoints, sendRobotConfig };
}
