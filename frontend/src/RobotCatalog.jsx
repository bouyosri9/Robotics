import React, { useMemo, useState } from "react";
import { ArrowRight, Boxes, Cpu, Eye, Gauge, Search, Sparkles } from "lucide-react";
import { ROBOT_LIST, getManufacturerAccent, getRobotDefinition } from "./robotDefinitions";

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
    tagline: "Pionnier chinois du cobot intelligent",
    blurb:
      "Fabricant chinois (Shanghai, fondé en 2014), leader du marché domestique chinois avec environ 22 % de part.",
  },
  "Universal Robots": {
    tagline: "Leader mondial du marché cobot",
    blurb:
      "Pionnier danois de la catégorie cobot depuis 2008, acteur mondial majeur du marché collaboratif.",
  },
};

/** Un spec vaut la peine d'être affiché seulement s'il est renseigné. */
function isKnown(value) {
  return value != null && value !== "unknown" && value !== "";
}

function formatNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : value;
}

function SpecCell({ label, value, unit }) {
  return (
    <div className="spec">
      <div className="spec__label">{label}</div>
      <div className="spec__value">
        {isKnown(value) ? (
          <>
            {formatNumber(value)}
            {unit && <small>{unit}</small>}
          </>
        ) : (
          <span style={{ color: "var(--text-faint)" }}>—</span>
        )}
      </div>
    </div>
  );
}

function PayloadMeter({ value, max }) {
  if (!isKnown(value)) return null;
  const pct = Math.min(100, (Number(value) / max) * 100);
  return (
    <div>
      <div className="meter__head">
        <span>Charge utile</span>
        <span style={{ color: "var(--accent)" }}>{Number(value)} kg</span>
      </div>
      <div className="meter__track">
        <div className="meter__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RobotCard({ robot, maxPayload, onSelect }) {
  const Icon = iconByFamily[robot.family] || Cpu;
  const specs = robot.specifications || {};

  return (
    <button
      className="card"
      style={{ "--accent": getManufacturerAccent(robot.manufacturer) }}
      onClick={() => onSelect(robot)}
    >
      <div className="card__head">
        <div style={{ display: "flex", gap: "10px", alignItems: "center", minWidth: 0 }}>
          <span className="card__icon">
            <Icon size={15} />
          </span>
          <span style={{ minWidth: 0 }}>
            <div className="card__name">{robot.name}</div>
            <div className="card__family">
              {robot.manufacturer} · {robot.family}
            </div>
          </span>
        </div>
        {specs.badge && <span className="chip chip--accent">{specs.badge}</span>}
      </div>

      <div className="specs">
        <SpecCell label="Portée" value={specs.reach} unit="mm" />
        <SpecCell label="Charge" value={specs.payload} unit="kg" />
        <SpecCell label="Axes" value={specs.axes ?? robot.dof} />
      </div>

      <PayloadMeter value={specs.payload} max={maxPayload} />

      <p className="card__desc">
        {specs.description ||
          `Modèle ${robot.dof ?? 6} axes${
            isKnown(specs.repeatability) ? `, répétabilité ${specs.repeatability}` : ""
          }. Cinématique et limites articulaires embarquées dans le simulateur.`}
      </p>

      <span className="card__cta">
        Simuler ce robot
        <ArrowRight size={14} />
      </span>
    </button>
  );
}

export default function RobotCatalog({ onSelectRobot }) {
  const [manufacturer, setManufacturer] = useState("all");
  const [query, setQuery] = useState("");

  const manufacturers = useMemo(
    () => [...new Set(ROBOT_LIST.map((robot) => robot.manufacturer))],
    []
  );

  const visibleRobots = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ROBOT_LIST.filter((robot) => {
      if (manufacturer !== "all" && robot.manufacturer !== manufacturer) return false;
      if (!needle) return true;
      return [robot.name, robot.family, robot.manufacturer, robot.id]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(needle));
    });
  }, [manufacturer, query]);

  // Une seule échelle de charge pour toute la grille : les barres restent
  // comparables d'une carte à l'autre, y compris entre constructeurs.
  const maxPayload = useMemo(
    () =>
      Math.max(
        ...ROBOT_LIST.map((robot) => Number(robot.specifications?.payload) || 0),
        30
      ),
    []
  );

  const meta = manufacturer !== "all" ? manufacturerMeta[manufacturer] : null;
  const accent = manufacturer !== "all" ? getManufacturerAccent(manufacturer) : undefined;

  return (
    <div style={accent ? { "--accent": accent } : undefined}>
      <section className="catalog__hero">
        <div>
          <div className="eyebrow">Catalogue robots collaboratifs</div>
          <h1 className="catalog__title">Choisissez un bras à simuler</h1>
          <p className="catalog__lede">
            Cinématique réelle, limites articulaires constructeur et modèle 3D articulé —
            pilotables en direct depuis le navigateur.
          </p>
        </div>

        <div className="catalog__counts">
          <div>
            <div className="count__value">{ROBOT_LIST.length}</div>
            <div className="count__label">Modèles</div>
          </div>
          <div>
            <div className="count__value">{manufacturers.length}</div>
            <div className="count__label">Constructeurs</div>
          </div>
        </div>
      </section>

      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Filtrer par constructeur">
          <button
            type="button"
            className="segmented__item"
            aria-pressed={manufacturer === "all"}
            onClick={() => setManufacturer("all")}
          >
            <Boxes size={14} />
            Tous
          </button>
          {manufacturers.map((name) => (
            <button
              key={name}
              type="button"
              className="segmented__item"
              aria-pressed={manufacturer === name}
              style={{ "--swatch": getManufacturerAccent(name) }}
              onClick={() => setManufacturer(name)}
            >
              <span className="segmented__swatch" />
              {name}
            </button>
          ))}
        </div>

        <label className="search">
          <Search size={15} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un modèle…"
            aria-label="Rechercher un modèle"
          />
        </label>

        <span className="chip mono">
          {visibleRobots.length} / {ROBOT_LIST.length}
        </span>
      </div>

      {meta && (
        <div className="brandbar">
          <div>
            <div className="brandbar__name">{manufacturer}</div>
            <p className="brandbar__text">
              <span style={{ color: "var(--accent)" }}>{meta.tagline}</span> — {meta.blurb}
            </p>
          </div>
        </div>
      )}

      {visibleRobots.length === 0 ? (
        <div className="empty">Aucun modèle ne correspond à « {query} ».</div>
      ) : (
        <div className="grid">
          {visibleRobots.map((robot) => (
            <RobotCard
              key={robot.id}
              robot={robot}
              maxPayload={maxPayload}
              onSelect={(selected) =>
                onSelectRobot && onSelectRobot(getRobotDefinition(selected.id))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
