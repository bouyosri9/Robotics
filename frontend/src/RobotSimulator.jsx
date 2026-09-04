import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  Home,
  Move3d,
  Pause,
  Play,
  RotateCcw,
  Square,
} from "lucide-react";
import RobotCanvas3D from "./RobotCanvas3D";
import { useRobotSocket } from "./useRobotSocket";
import { getDefaultJointValues, getManufacturerAccent } from "./robotDefinitions";
import { computeRobotFkFromDefinition } from "./forwardKinematics";

const TRANSPORT = [
  { command: "start", label: "Start", Icon: Play, tone: "var(--ok)" },
  { command: "pause", label: "Pause", Icon: Pause, tone: "var(--warn)" },
  { command: "home", label: "Home", Icon: Home, tone: "var(--accent)" },
  { command: "stop", label: "Stop", Icon: Square, tone: "var(--danger)" },
];

function isKnown(value) {
  return value != null && value !== "unknown" && value !== "";
}

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

  const resetJoints = useCallback(() => {
    if (!robot?.joints) return;
    const pose = getDefaultJointValues(robot);
    setOverrides(pose);
    sendJoints(pose);
  }, [robot, sendJoints]);

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

  if (!robot) {
    return <div className="empty">Aucun robot sélectionné.</div>;
  }

  const notice = lastError
    ? { text: lastError, tone: "var(--danger)" }
    : connected && !robotSynced
      ? {
          text: `Backend sur « ${state?.robotName} » — configuration ${robot.name} en cours…`,
          tone: "var(--warn)",
        }
      : null;

  const specs = robot.specifications || {};
  const specRows = [
    { key: "Portée", value: isKnown(specs.reach) ? `${specs.reach} mm` : null },
    { key: "Charge utile", value: isKnown(specs.payload) ? `${specs.payload} kg` : null },
    { key: "Répétabilité", value: isKnown(specs.repeatability) ? specs.repeatability : null },
    {
      key: "Masse",
      value: isKnown(specs.weight)
        ? typeof specs.weight === "number"
          ? `${specs.weight} kg`
          : specs.weight
        : null,
    },
  ].filter((row) => row.value);

  const renderSlider = (joint) => {
    const value = displayJoints[joint.key] ?? joint.default ?? 0;
    const fill = ((value - joint.min) / (joint.max - joint.min)) * 100;

    return (
      <div className="joint" key={joint.key}>
        <div className="joint__head">
          <span className="joint__label">
            {joint.label}
            {joint.continuous && (
              <span style={{ color: "var(--text-faint)", fontWeight: 400 }}> · continu</span>
            )}
          </span>
          <span className="joint__value">{Math.round(value)}°</span>
        </div>
        <input
          className="joint__range"
          style={{ "--fill": `${Math.min(100, Math.max(0, fill))}%` }}
          type="range"
          min={joint.min}
          max={joint.max}
          step="1"
          value={value}
          aria-label={`Articulation ${joint.label}`}
          onChange={(event) => handleJointChange(joint.key, event.target.value)}
        />
        <div className="joint__limits">
          <span>{joint.min}°</span>
          <span>{joint.max}°</span>
        </div>
      </div>
    );
  };

  return (
    <div className="sim" style={{ "--accent": getManufacturerAccent(robot.manufacturer) }}>
      <aside className="panel">
        <div className="panel__head">
          <button className="btn btn--ghost btn--sm" onClick={onBack}>
            <ChevronLeft size={14} />
            Catalogue
          </button>
          <span className={`chip ${connected ? "chip--ok" : "chip--off"}`}>
            <span className={`dot ${connected ? "dot--live" : ""}`} />
            {connected ? displayStatus : "hors ligne"}
          </span>
        </div>

        <div className="panel__body">
          <div>
            <div className="section__head">
              <span className="section__title">Modèle</span>
              <span className="chip chip--accent">{robot.manufacturer}</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 650, letterSpacing: "-0.02em" }}>
              {robot.name}
            </div>
            <div className="card__family">
              {robot.family} · {robot.dof ?? 6} axes
            </div>

            {notice && (
              <div className="notice" style={{ "--tone": notice.tone, marginTop: "12px" }}>
                <AlertTriangle size={14} />
                <span>{notice.text}</span>
              </div>
            )}
            {!connected && !notice && (
              <div className="notice" style={{ "--tone": "var(--text-faint)", marginTop: "12px" }}>
                <AlertTriangle size={14} />
                <span>Backend injoignable — simulation locale, cinématique calculée dans le navigateur.</span>
              </div>
            )}
          </div>

          <div>
            <div className="section__head">
              <span className="section__title">Articulations (°)</span>
              <button className="btn btn--ghost btn--sm" onClick={resetJoints} title="Pose par défaut">
                <RotateCcw size={12} />
                Reset
              </button>
            </div>
            {robot.joints?.map((joint) => renderSlider(joint))}
          </div>

          {tcp && (
            <div>
              <div className="section__head">
                <span className="section__title">Position TCP (mm)</span>
                <span className="chip">{tcp.exact ? "DH" : "approx."}</span>
              </div>
              <div className="tcp">
                {["x", "y", "z"].map((axis) => (
                  <div className="tcp__cell" key={axis}>
                    <div className="tcp__axis">{axis.toUpperCase()}</div>
                    <div className="tcp__num">{tcp[axis].toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {specRows.length > 0 && (
            <div>
              <div className="section__head">
                <span className="section__title">Caractéristiques</span>
              </div>
              <div className="rows">
                {specRows.map((row) => (
                  <div className="row" key={row.key}>
                    <span className="row__key">{row.key}</span>
                    <span className="row__val">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="panel__foot">
          <div className="transport">
            {TRANSPORT.map(({ command, label, Icon, tone }) => (
              <button
                key={command}
                className="btn btn--tone"
                style={{ "--tone": tone }}
                onClick={() => sendCommand(command)}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="viewport">
        <div className="viewport__canvas">
          <RobotCanvas3D
            joints={displayJoints}
            assetFile={robot.model?.url || robot.asset}
            robotName={robot.name}
            robot={robot}
          />
        </div>

        <div className="viewport__hud viewport__hud--tl">
          <span className="hud-pill">
            <strong>{robot.name}</strong> · {robot.manufacturer}
          </span>
        </div>

        <div className="viewport__hud viewport__hud--br">
          <span className="hud-pill">
            <Move3d size={13} />
            Glisser pour orbiter · molette pour zoomer
          </span>
        </div>
      </section>
    </div>
  );
}
