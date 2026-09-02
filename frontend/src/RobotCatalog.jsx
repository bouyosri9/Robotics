import React, { useState } from "react";
import { ArrowRight, ChevronLeft, Cpu, Eye, Gauge, Sparkles } from "lucide-react";
import { ROBOT_LIST, getRobotDefinition } from "./robotDefinitions";

const iconByFamily = {
  Zu: Cpu,
  Ai: Eye,
  Mini: Gauge,
  "UR Series": Sparkles,
  "e-Series": Cpu,
  AI: Sparkles,
};

const manufacturerMeta = {
  JAKA: {
    name: "JAKA",
    tagline: "Pionnier chinois du cobot intelligent",
    blurb: "Fabricant chinois (Shanghai, fondé en 2014), leader du marché domestique chinois (~22% de part).",
    accent: "#18a0c9",
  },
  "Universal Robots": {
    name: "Universal Robots",
    tagline: "Leader mondial du marché cobot",
    blurb: "Pionnier danois de la catégorie cobot depuis 2008, acteur mondial majeur du marché collaboratif.",
    accent: "#ff8a3d",
  },
};

function PayloadBar({ value, max, accent }) {
  if (value == null || value === "unknown") return null;
  const numericValue = Number(value);
  const pct = Math.min(100, (numericValue / max) * 100);
  return (
    <div style={{ marginTop: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#6b7684", marginBottom: "4px", fontFamily: "monospace" }}>
        <span>CHARGE</span>
        <span style={{ color: accent }}>{numericValue} kg</span>
      </div>
      <div style={{ height: "4px", background: "#1c2430", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: accent, borderRadius: "2px" }} />
      </div>
    </div>
  );
}

function ModelCard({ robot, accent, maxPayload, onSelect }) {
  const Icon = iconByFamily[robot.family] || Cpu;
  return (
    <button
      onClick={() => onSelect(robot)}
      style={{
        textAlign: "left",
        background: robot.featured ? `${accent}0d` : "#11161d",
        border: `1px solid ${robot.featured ? accent : "#1c2430"}`,
        borderRadius: "12px",
        padding: "18px",
        cursor: "pointer",
        transition: "border-color 0.15s, transform 0.15s",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        fontFamily: "inherit",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = robot.featured ? accent : "#1c2430";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon size={16} color={accent} />
          <span style={{ fontSize: "17px", fontWeight: 700, color: "#e8ecef" }}>{robot.name}</span>
        </div>
        {robot.specifications?.badge && (
          <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: accent, background: `${accent}18`, border: `1px solid ${accent}55`, borderRadius: "20px", padding: "3px 8px", whiteSpace: "nowrap" }}>
            {robot.specifications.badge}
          </span>
        )}
      </div>
      <div style={{ fontSize: "11px", color: "#6b7684", fontFamily: "monospace" }}>{robot.family}</div>
      {robot.specifications?.reach && robot.specifications.reach !== "unknown" && (
        <div style={{ fontSize: "11px", color: "#8b95a3", fontFamily: "monospace", marginTop: "2px" }}>
          Portée {robot.specifications.reach} mm
        </div>
      )}
      <PayloadBar value={robot.specifications?.payload} max={maxPayload} accent={accent} />
      <p style={{ fontSize: "12px", color: "#8b95a3", lineHeight: 1.5, marginTop: "10px", marginBottom: "8px" }}>
        {robot.specifications?.description || "Configuration robot générée à partir de la définition de modèle."}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: accent, marginTop: "auto" }}>
        Simuler ce robot <ArrowRight size={13} />
      </div>
    </button>
  );
}

function BrandTile({ brand, robots, onEnter }) {
  const accent = manufacturerMeta[brand]?.accent || "#18a0c9";
  return (
    <button
      onClick={() => onEnter(brand)}
      style={{ flex: 1, minWidth: "260px", background: "#11161d", border: "1px solid #1c2430", borderRadius: "16px", padding: "28px", textAlign: "left", cursor: "pointer", transition: "border-color 0.15s, transform 0.15s", fontFamily: "inherit" }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = "#1c2430";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: accent, textTransform: "uppercase", marginBottom: "8px" }}>
        {manufacturerMeta[brand]?.tagline || brand}
      </div>
      <div style={{ fontSize: "30px", fontWeight: 800, color: "#e8ecef", marginBottom: "10px" }}>
        {brand}
      </div>
      <p style={{ fontSize: "13px", color: "#8b95a3", lineHeight: 1.6, marginBottom: "18px" }}>{manufacturerMeta[brand]?.blurb || "Constructeur robotique."}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: accent }}>
        Voir les {robots.length} modèles <ArrowRight size={14} />
      </div>
    </button>
  );
}

export default function RobotCatalog({ onSelectRobot }) {
  const [activeManufacturer, setActiveManufacturer] = useState(null);
  const groups = Object.values(ROBOT_LIST.reduce((acc, robot) => {
    const manufacturer = robot.manufacturer;
    if (!acc[manufacturer]) {
      acc[manufacturer] = { name: manufacturer, accent: manufacturerMeta[manufacturer]?.accent || "#18a0c9", robots: [] };
    }
    acc[manufacturer].robots.push(robot);
    return acc;
  }, {}));
  const activeGroup = activeManufacturer ? groups.find((group) => group.name === activeManufacturer) : null;

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#0a0d12", color: "#e8ecef", minHeight: "640px", borderRadius: "14px", border: "1px solid #1c2430", padding: "32px" }}>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "11px", letterSpacing: "0.12em", color: "#6b7684", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>
          Catalogue robots collaboratifs
        </div>
        <h1 style={{ fontSize: "26px", fontWeight: 800, margin: 0 }}>
          {activeGroup ? `Gamme ${activeGroup.name}` : "Choisissez un constructeur"}
        </h1>
      </div>

      {!activeGroup && (
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {groups.map((group) => (
            <BrandTile key={group.name} brand={group.name} robots={group.robots} onEnter={setActiveManufacturer} />
          ))}
        </div>
      )}

      {activeGroup && (
        <>
          <button onClick={() => setActiveManufacturer(null)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#8b95a3", fontSize: "12px", cursor: "pointer", padding: 0, marginBottom: "18px" }}>
            <ChevronLeft size={14} /> Retour aux constructeurs
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "14px" }}>
            {activeGroup.robots.map((robot) => (
              <ModelCard
                key={robot.id}
                robot={robot}
                accent={activeGroup.accent}
                maxPayload={Math.max(...activeGroup.robots.map((item) => Number(item.specifications?.payload || 0)), 30)}
                onSelect={(selectedRobot) => onSelectRobot && onSelectRobot(getRobotDefinition(selectedRobot.id))}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
