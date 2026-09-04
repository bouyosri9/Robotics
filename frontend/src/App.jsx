import React, { useEffect, useState } from "react";
import { ChevronRight, Hexagon } from "lucide-react";
import RobotCatalog from "./RobotCatalog";
import RobotSimulator from "./RobotSimulator";
import { getRobotDefinition, MANUFACTURER_ACCENTS } from "./robotDefinitions";
import "./App.css";

function readRobotFromLocation() {
  if (typeof window === "undefined") return null;

  const match = window.location.pathname.match(/^\/robot\/([^/]+)/i);
  const directId = match ? match[1] : new URLSearchParams(window.location.search).get("robot");
  if (!directId) return null;

  const robotId = directId.toLowerCase();
  return getRobotDefinition(robotId);
}

export default function App() {
  const [selectedRobot, setSelectedRobot] = useState(() => readRobotFromLocation());

  const applyRobotSelection = (robot) => {
    setSelectedRobot(robot);
    if (typeof window !== "undefined") {
      const target = robot ? `/robot/${robot.id}` : "/";
      window.history.pushState({}, "", target);
    }
  };

  useEffect(() => {
    const onPopState = () => {
      setSelectedRobot(readRobotFromLocation());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // The accent follows the manufacturer of whatever is on screen, so the whole
  // chrome (header mark, sliders, hover states) shifts with the brand.
  const accent = selectedRobot
    ? MANUFACTURER_ACCENTS[selectedRobot.manufacturer] || MANUFACTURER_ACCENTS.default
    : MANUFACTURER_ACCENTS.default;

  return (
    <div className="shell" style={{ "--accent": accent }}>
      <header className="topbar">
        <button
          className="brand"
          onClick={() => applyRobotSelection(null)}
          title="Retour au catalogue"
        >
          <span className="brand__mark">
            <Hexagon size={15} strokeWidth={2.2} />
          </span>
          <span>
            <span className="brand__name">Cobot Studio</span>
            <span className="brand__sub">Simulateur collaboratif</span>
          </span>
        </button>

        {selectedRobot && (
          <nav className="crumbs" aria-label="Fil d'ariane">
            <span>{selectedRobot.manufacturer}</span>
            <ChevronRight size={13} />
            <span className="crumbs__current">{selectedRobot.name}</span>
          </nav>
        )}

        <span className="topbar__spacer" />

        <span className="chip">
          <span className="dot" style={{ color: "var(--accent)" }} />
          {selectedRobot ? `${selectedRobot.dof ?? 6} axes` : "Catalogue"}
        </span>
      </header>

      <main className="main">
        {!selectedRobot ? (
          <RobotCatalog onSelectRobot={applyRobotSelection} />
        ) : (
          <RobotSimulator
            selectedRobot={selectedRobot}
            onBack={() => applyRobotSelection(null)}
          />
        )}
      </main>
    </div>
  );
}
