import React, { useEffect, useState } from "react";
import RobotCatalog from "./RobotCatalog";
import RobotSimulator from "./RobotSimulator";
import { getRobotDefinition } from "./robotDefinitions";

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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#05070a",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: "1100px" }}>
        {!selectedRobot ? (
          <RobotCatalog onSelectRobot={applyRobotSelection} />
        ) : (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
                padding: "0 4px",
              }}
            >
              <button
                onClick={() => applyRobotSelection(null)}
                style={{
                  background: "none",
                  border: "1px solid #1c2430",
                  color: "#8b95a3",
                  fontSize: "12px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                ← Changer de robot
              </button>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "12px",
                  color: "#6b7684",
                }}
              >
                {selectedRobot.manufacturer} — {selectedRobot.name}
              </div>
            </div>
            <RobotSimulator selectedRobot={selectedRobot} onBack={() => applyRobotSelection(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
