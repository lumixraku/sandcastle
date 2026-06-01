import { useEffect } from "react";
import { useGame, ToolId, MoldId, DecorationId } from "../game/store";

const sand = "#8a6a3b";
const accent = "#b88f55";

const MOLDS: { id: MoldId; label: string; icon: JSX.Element }[] = [
  { id: "square-tower", label: "Square Tower", icon: iconSquareTower() },
  { id: "round-tower", label: "Round Tower", icon: iconRoundTower() },
  { id: "wall", label: "Wall", icon: iconWall() },
  { id: "wall-corner", label: "Corner", icon: iconCorner() },
  { id: "gate", label: "Gate", icon: iconGate() },
  { id: "mound", label: "Mound", icon: iconMound() },
  { id: "flag", label: "Flag", icon: iconFlag() },
];

const DECORATIONS: { id: DecorationId; label: string; icon: JSX.Element }[] = [
  { id: "shell", label: "Shell", icon: iconShell() },
  { id: "pebble", label: "Pebbles", icon: iconPebble() },
  { id: "driftwood", label: "Driftwood", icon: iconDriftwood() },
  { id: "seaweed", label: "Seaweed", icon: iconSeaweed() },
  { id: "starfish", label: "Starfish", icon: iconStarfish() },
];

export function HUD() {
  const tool = useGame((s) => s.tool);
  const setTool = useGame((s) => s.setTool);
  const tide = useGame((s) => s.tide);
  const tideRunning = useGame((s) => s.tideRunning);
  const setTideRunning = useGame((s) => s.setTideRunning);
  const setTide = useGame((s) => s.setTide);
  const clear = useGame((s) => s.clearPieces);
  const rotate = useGame((s) => s.rotate);
  const setRotation = useGame((s) => s.setRotation);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") rotate(Math.PI / 8);
      if (e.key === "e" || e.key === "E") setTool("erase");
      if (e.key === "1") setTool("square-tower");
      if (e.key === "2") setTool("round-tower");
      if (e.key === "3") setTool("wall");
      if (e.key === "4") setTool("wall-corner");
      if (e.key === "5") setTool("gate");
      if (e.key === "6") setTool("mound");
      if (e.key === "7") setTool("flag");
      if (e.key === "Escape") {
        setTool("square-tower");
        setRotation(0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rotate, setTool, setRotation]);

  return (
    <div className="hud">
      <div className="top-bar">
        <div className="title">
          <h1>Sandcastle</h1>
          <p>A quiet hour on a warm shore — build, decorate, then let the tide return.</p>
        </div>
        <div className="controls">
          <div className="tide-panel">
            <div className="tide-row">
              <span>Tide</span>
              <span>{Math.round(tide * 100)}%</span>
            </div>
            <div className="tide-bar">
              <div style={{ width: `${tide * 100}%` }} />
            </div>
            <div className="tide-buttons">
              <button className="btn" onClick={() => setTideRunning(!tideRunning)}>
                {tideRunning ? "⏸ Hold tide" : "▶ Let tide rise"}
              </button>
              <button className="btn" onClick={() => setTide(0.1)}>↺ Low tide</button>
            </div>
          </div>
          <div className="tide-buttons">
            <button className="btn" onClick={() => rotate(Math.PI / 8)}>
              ⤾ Rotate (R)
            </button>
            <button
              className={`btn ${tool === "erase" ? "primary" : ""}`}
              onClick={() => setTool("erase")}
            >
              ✦ Erase (E)
            </button>
            <button className="btn danger" onClick={clear}>
              Clear all
            </button>
          </div>
        </div>
      </div>

      <div className="bottom-bar">
        <div>
          <div className="mold-picker">
            {MOLDS.map((m) => (
              <MoldButton key={m.id} id={m.id} label={m.label} icon={m.icon} active={tool === m.id} onClick={() => setTool(m.id)} />
            ))}
            <div style={{ width: 1, background: "rgba(74,50,32,0.15)", margin: "4px 6px" }} />
            {DECORATIONS.map((d) => (
              <MoldButton key={d.id} id={d.id} label={d.label} icon={d.icon} active={tool === d.id} onClick={() => setTool(d.id)} />
            ))}
          </div>
          <div className="tip">
            Click sand to place · R to rotate · E to erase · drag to orbit · scroll to zoom
          </div>
        </div>
      </div>
    </div>
  );
}

function MoldButton({
  id,
  label,
  icon,
  active,
  onClick,
}: {
  id: ToolId;
  label: string;
  icon: JSX.Element;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`mold ${active ? "active" : ""}`} onClick={onClick} title={label}>
      {icon}
      <span className="label">{label}</span>
    </button>
  );
}

/* ----- tiny inline SVG icons (sand color) ----- */

function iconSquareTower() {
  return (
    <svg viewBox="0 0 32 32" fill="none">
      <rect x="9" y="10" width="14" height="16" fill={sand} />
      <rect x="7" y="9" width="18" height="2" fill={accent} />
      <rect x="9" y="6" width="2" height="3" fill={sand} />
      <rect x="13" y="6" width="2" height="3" fill={sand} />
      <rect x="17" y="6" width="2" height="3" fill={sand} />
      <rect x="21" y="6" width="2" height="3" fill={sand} />
      <rect x="14" y="16" width="4" height="10" fill={accent} />
    </svg>
  );
}
function iconRoundTower() {
  return (
    <svg viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="11" rx="9" ry="2.5" fill={accent} />
      <path d="M7 11 v14 a9 2.5 0 0 0 18 0 V11" fill={sand} />
      <rect x="9" y="7" width="2.4" height="4" fill={sand} />
      <rect x="14" y="6.5" width="2.4" height="4.5" fill={sand} />
      <rect x="19" y="7" width="2.4" height="4" fill={sand} />
      <rect x="14" y="15" width="4" height="10" fill={accent} />
    </svg>
  );
}
function iconWall() {
  return (
    <svg viewBox="0 0 32 32" fill="none">
      <rect x="4" y="12" width="24" height="12" fill={sand} />
      <rect x="3" y="10" width="26" height="2" fill={accent} />
      <rect x="4" y="6.5" width="3" height="3.5" fill={sand} />
      <rect x="10" y="6.5" width="3" height="3.5" fill={sand} />
      <rect x="16" y="6.5" width="3" height="3.5" fill={sand} />
      <rect x="22" y="6.5" width="3" height="3.5" fill={sand} />
    </svg>
  );
}
function iconCorner() {
  return (
    <svg viewBox="0 0 32 32" fill="none">
      <rect x="4" y="20" width="20" height="6" fill={sand} />
      <rect x="18" y="4" width="6" height="20" fill={sand} />
      <rect x="3" y="18" width="22" height="2" fill={accent} />
      <rect x="16" y="3" width="2" height="22" fill={accent} />
    </svg>
  );
}
function iconGate() {
  return (
    <svg viewBox="0 0 32 32" fill="none">
      <rect x="4" y="10" width="6" height="16" fill={sand} />
      <rect x="22" y="10" width="6" height="16" fill={sand} />
      <rect x="10" y="10" width="12" height="6" fill={sand} />
      <rect x="11" y="16" width="10" height="10" fill={accent} />
      <rect x="3" y="8.5" width="26" height="2" fill={accent} />
    </svg>
  );
}
function iconMound() {
  return (
    <svg viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="22" rx="11" ry="6" fill={sand} />
      <ellipse cx="20" cy="20" rx="4" ry="2.5" fill={accent} />
    </svg>
  );
}
function iconFlag() {
  return (
    <svg viewBox="0 0 32 32" fill="none">
      <rect x="14" y="4" width="1.5" height="24" fill="#7a5a35" />
      <path d="M16 5 L26 9 L16 13 Z" fill="#c1432e" />
    </svg>
  );
}
function iconShell() {
  return (
    <svg viewBox="0 0 32 32" fill="none">
      <path d="M16 6 C8 6 5 15 16 26 C27 15 24 6 16 6 Z" fill="#f1c084" stroke="#a87246" />
      <path d="M16 6 L16 24" stroke="#a87246" strokeWidth="0.6" />
      <path d="M11 9 L13 23" stroke="#a87246" strokeWidth="0.5" />
      <path d="M21 9 L19 23" stroke="#a87246" strokeWidth="0.5" />
    </svg>
  );
}
function iconPebble() {
  return (
    <svg viewBox="0 0 32 32" fill="none">
      <ellipse cx="11" cy="20" rx="5" ry="3.5" fill="#9aa7b0" />
      <ellipse cx="20" cy="22" rx="6" ry="3.5" fill="#7e8a92" />
      <ellipse cx="22" cy="14" rx="4" ry="2.5" fill="#bdb0a0" />
    </svg>
  );
}
function iconDriftwood() {
  return (
    <svg viewBox="0 0 32 32" fill="none">
      <rect x="4" y="14" width="24" height="5" rx="2.5" fill="#a48460" />
      <circle cx="11" cy="16.5" r="2.2" fill="#7d5a3a" />
      <circle cx="22" cy="16.5" r="1.7" fill="#7d5a3a" />
    </svg>
  );
}
function iconSeaweed() {
  return (
    <svg viewBox="0 0 32 32" fill="none">
      <path d="M10 26 C8 18 14 16 12 8" stroke="#3e7f4d" strokeWidth="2.5" fill="none" />
      <path d="M18 26 C22 18 16 14 20 7" stroke="#5a8d3a" strokeWidth="2.5" fill="none" />
      <path d="M24 26 C22 20 26 16 24 10" stroke="#3e7f4d" strokeWidth="2.2" fill="none" />
    </svg>
  );
}
function iconStarfish() {
  return (
    <svg viewBox="0 0 32 32" fill="none">
      <polygon points="16,4 19,12 28,12 21,18 24,27 16,22 8,27 11,18 4,12 13,12" fill="#d96a4a" stroke="#a23f25" strokeWidth="0.6" />
    </svg>
  );
}
