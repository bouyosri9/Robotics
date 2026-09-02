import React, { useState, useEffect, useMemo, useCallback } from "react";
import RobotCanvas3D from "./RobotCanvas3D";
import { useRobotSocket } from "./useRobotSocket";
import { getDefaultJointValues } from "./robotDefinitions";
import { computeRobotFkFromDefinition } from "./forwardKinematics";

export default function RobotSimulator({ selectedRobot, onBack }) {
  const robot = selectedRobot;
  const { state, connected, lastError, sendCommand, sendJoints, sendRobotConfig } = useRobotSocket();

  const defaultJoints = useMemo(() => getDefaultJointValues(robot), [robot?.id]);

  // Angles saisis à la main, appliqués immédiatement à l'affichage. Sans cette
  // couche, `state.joints` écrasait chaque mouvement de curseur : dès que le
  // WebSocket était connecté, le robot restait figé sur la pose du backend.
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    setOverrides({});
  }, [robot?.id]);

  // Le backend démarre sur un robot générique : limites ±180°, pose de repos et
  // cotes différentes. Tant qu'on ne lui transmet pas la définition sélectionnée,
  // il refuse les angles UR3e au-delà de 180° et diffuse la mauvaise pose.
  // Renvoyé à chaque (re)connexion, pour le cas où le backend a redémarré.
  useEffect(() => {
    if (robot && connected) sendRobotConfig(robot);
  }, [robot, connected, sendRobotConfig]);

  const robotSynced = !state || state.robotId === robot?.id;

  // Une fois que le backend a rejoint l'angle demandé, on rend la main au flux
  // temps réel, sinon les commandes Start / Home / Stop n'animeraient plus rien.
  useEffect(() => {
    const serverJoints = state?.joints;
    if (!serverJoints) return;
    setOverrides((prev) => {
      const next = {};
      let released = false;
      for (const [key, value] of Object.entries(prev)) {
        if (Math.abs((serverJoints[key] ?? 0) - value) < 0.5) released = true;
        else next[key] = value;
      }
      return released ? next : prev;
    });
  }, [state]);

  // Les angles du backend ne comptent qu'une fois le bon robot chargé chez lui.
  const displayJoints = useMemo(
    () => ({ ...defaultJoints, ...(robotSynced ? state?.joints : null), ...overrides }),
    [defaultJoints, robotSynced, state, overrides]
  );
  const displayStatus = (robotSynced && state?.status) || "idle";

  const handleJointChange = useCallback(
    async (jointKey, value) => {
      const angle = parseFloat(value);
      if (Number.isNaN(angle)) return;

      setOverrides((prev) => ({ ...prev, [jointKey]: angle }));
      const result = await sendJoints({ [jointKey]: angle });

      // Refus explicite (hors limites) : la valeur du backend fait foi. S'il est
      // seulement injoignable, on garde l'angle local et la simulation continue.
      if (!result.ok && result.rejected) {
        setOverrides((prev) => {
          const next = { ...prev };
          delete next[jointKey];
          return next;
        });
      }
    },
    [sendJoints]
  );

  // Le backend calcule un TCP planaire à 3 segments avec les cotes du robot
  // générique, en millimètres. Quand la définition fournit une table DH, on
  // calcule le TCP réel côté client (en mètres) et on l'affiche en millimètres.
  const tcp = useMemo(() => {
    if (robot?.kinematics?.dh) {
      const { position } = computeRobotFkFromDefinition(robot, displayJoints);
      return { x: position.x * 1000, y: position.y * 1000, z: position.z * 1000, exact: true };
    }
    return state?.tcp ? { ...state.tcp, exact: false } : null;
  }, [robot, displayJoints, state?.tcp]);

  const renderSlider = (joint) => {
    const value = displayJoints[joint.key] ?? joint.default;
    return (
      <div key={joint.key} style={{ marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#8b95a3", marginBottom: "4px", fontFamily: "sans-serif" }}>
          <span>{joint.label}</span>
          <span>{Math.round(value)}°</span>
        </div>
        <input
          type="range"
          min={joint.min}
          max={joint.max}
          step="1"
          value={value}
          onChange={(e) => handleJointChange(joint.key, e.target.value)}
          style={{ width: "100%", accentColor: "#0ea5e9", background: "#1c2430", height: "6px", borderRadius: "3px", outline: "none", cursor: "pointer" }}
        />
      </div>
    );
  };

  if (!robot) {
    return <div style={{ color: "#fff", padding: "20px", textAlign: "center" }}>Aucun robot sélectionné.</div>;
  }

  const notice = lastError
    ? { text: lastError, color: "#f87171", border: "#ef4444", background: "rgba(239, 68, 68, 0.1)" }
    : connected && !robotSynced
      ? { text: `Backend sur "${state?.robotName}" — configuration ${robot.name} en cours...`, color: "#fbbf24", border: "#f59e0b", background: "rgba(245, 158, 11, 0.1)" }
      : null;

  return (
    <div style={{ display: "flex", height: "85vh", background: "#0c1017", borderRadius: "12px", border: "1px solid #1c2430", overflow: "hidden" }}>
      <div style={{ width: "340px", background: "#0c1017", borderRight: "1px solid #1c2430", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1c2430", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#0ea5e9", fontWeight: "bold", letterSpacing: "1px", marginBottom: "2px" }}>⚙️ ROBOT SIMULATOR</div>
            <div style={{ fontSize: "12px", color: "#6b7684" }}>MODEL: <span style={{ color: "#fff" }}>{robot.name}</span></div>
          </div>
          <button onClick={onBack} style={{ background: "#161b22", border: "1px solid #30363d", color: "#c9d1d9", padding: "5px 10px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}>Back</button>
        </div>

        <div style={{ padding: "20px", flex: 1, overflowY: "auto" }}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "10px", color: "#6b7684", display: "block", marginBottom: "6px", letterSpacing: "0.5px" }}>STATUS</label>
            <div style={{ background: connected ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", border: `1px solid ${connected ? "#10b981" : "#ef4444"}`, color: connected ? "#34d399" : "#f87171", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "500", display: "flex", alignItems: "center" }}>
              <div style={{ width: "8px", height: "8px", background: connected ? "#34d399" : "#f87171", borderRadius: "50%", marginRight: "10px", boxShadow: `0 0 8px ${connected ? "#34d399" : "#f87171"}` }} />
              {connected ? `Connected (${displayStatus})` : "Hors ligne - simulation locale"}
            </div>
            {notice && (
              <div style={{ marginTop: "8px", background: notice.background, border: `1px solid ${notice.border}`, color: notice.color, padding: "8px 12px", borderRadius: "8px", fontSize: "11px", lineHeight: 1.45 }}>
                {notice.text}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "10px", color: "#6b7684", display: "block", marginBottom: "14px", letterSpacing: "0.5px" }}>JOINTS (°)</label>
            {robot.joints?.map((joint) => renderSlider(joint))}
          </div>

          {tcp && (
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "10px", color: "#6b7684", display: "block", marginBottom: "6px", letterSpacing: "0.5px" }}>
                TCP POSITION (mm){tcp.exact ? " - DH" : " - approx."}
              </label>
              <div style={{ background: "rgba(14, 165, 233, 0.1)", border: "1px solid #0ea5e9", color: "#38bdf8", padding: "10px 14px", borderRadius: "8px", fontSize: "11px", fontFamily: "monospace" }}>
                <div>X: {tcp.x.toFixed(1)}</div>
                <div>Y: {tcp.y.toFixed(1)}</div>
                <div>Z: {tcp.z.toFixed(1)}</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 20px", borderTop: "1px solid #1c2430", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#0c1017" }}>
          <button onClick={() => sendCommand("start")} style={{ background: "#10b981", color: "white", border: "none", padding: "10px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>▶ Start</button>
          <button onClick={() => sendCommand("pause")} style={{ background: "#f59e0b", color: "white", border: "none", padding: "10px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>❚❚ Pause</button>
          <button onClick={() => sendCommand("home")} style={{ background: "#0ea5e9", color: "white", border: "none", padding: "10px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>🏠 Home</button>
          <button onClick={() => sendCommand("stop")} style={{ background: "#ef4444", color: "white", border: "none", padding: "10px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>⏹ Stop</button>
        </div>
      </div>

      <div style={{ flex: 1, background: "#0b0f17", position: "relative", overflow: "hidden" }}>
        <RobotCanvas3D joints={displayJoints} assetFile={robot.model?.url || robot.asset} robotName={robot.name} robot={robot} />
        <div style={{ position: "absolute", top: "16px", right: "24px", fontSize: "12px", color: "#6b7684", fontFamily: "monospace" }}>
          {robot.manufacturer} — {robot.name}
        </div>
      </div>
    </div>
  );
}
