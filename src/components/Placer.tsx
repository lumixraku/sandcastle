import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { useGame, MoldId, DecorationId, ToolId } from "../game/store";
import { CastlePiece, MOLD_SHAPES } from "./CastlePiece";
import { Decoration, DECORATION_SHAPES } from "./Decoration";
import { ghostSandMaterial, ghostSandDarkMaterial } from "../game/materials";
import { ISLAND_RADIUS, sandHeight, withinIsland } from "../game/terrain";

const MOLD_IDS: MoldId[] = [
  "square-tower",
  "round-tower",
  "wall",
  "wall-corner",
  "gate",
  "mound",
  "flag",
];
const DECO_IDS: DecorationId[] = ["shell", "pebble", "driftwood", "seaweed", "starfish"];

function classify(t: ToolId): "mold" | "decoration" | "erase" {
  if (t === "erase") return "erase";
  return (MOLD_IDS as ToolId[]).includes(t) ? "mold" : "decoration";
}

interface Props {
  cursor: { x: number; z: number; valid: boolean } | null;
}

/** Renders the ghost preview at the current cursor position. */
export function GhostPreview({ cursor }: Props) {
  const tool = useGame((s) => s.tool);
  const rotation = useGame((s) => s.rotation);
  const seedRef = useRef(Math.floor(Math.random() * 10000));
  const groupRef = useRef<THREE.Group>(null);

  const kind = classify(tool);

  // The ghost subtree contains only materials that are safe to mutate:
  //  - castle meshes use ghostSand* singletons (never used by placed pieces)
  //  - decorations & footprint ring use fresh inline materials (local subtree)
  // So a single useFrame walk pulses opacity + valid/invalid tint without
  // leaking into the placed-piece materials.
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.visible = !!cursor && kind !== "erase";
    if (!cursor) return;
    const t = state.clock.elapsedTime;
    const pulse = 0.65 + Math.sin(t * 4) * 0.05;
    const target = cursor.valid ? pulse : pulse * 0.45;
    const tint = cursor.valid ? "#3a5a30" : "#702020";

    // Always set the ghost-sand singletons even if the subtree hasn't been
    // traversed yet this frame.
    for (const mat of [ghostSandMaterial(), ghostSandDarkMaterial()]) {
      mat.opacity = target;
      mat.emissive.set(tint);
      mat.emissiveIntensity = 0.2;
    }

    groupRef.current.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const m = mesh.material;
      const apply = (mat: THREE.Material) => {
        if ("opacity" in mat) {
          mat.transparent = true;
          (mat as THREE.MeshStandardMaterial).opacity = target;
          (mat as THREE.MeshStandardMaterial).depthWrite = false;
        }
        const std = mat as THREE.MeshStandardMaterial;
        if ("emissive" in std && std.emissive) {
          std.emissive.set(tint);
          std.emissiveIntensity = 0.2;
        }
      };
      if (Array.isArray(m)) m.forEach(apply);
      else if (m) apply(m);
    });
  });

  if (!cursor || kind === "erase") return null;

  const y = sandHeight(cursor.x, cursor.z);

  return (
    <group ref={groupRef} position={[cursor.x, y, cursor.z]} rotation={[0, rotation, 0]}>
      {kind === "mold" ? (
        <CastlePiece variant={tool as MoldId} ghost />
      ) : (
        <Decoration variant={tool as DecorationId} seed={seedRef.current} />
      )}
      <FootprintRing tool={tool} valid={cursor.valid} />
    </group>
  );
}

function FootprintRing({ tool, valid }: { tool: ToolId; valid: boolean }) {
  const size = useMemo(() => {
    const kind = classify(tool);
    if (kind === "mold") return MOLD_SHAPES[tool as MoldId];
    if (kind === "decoration") return DECORATION_SHAPES[tool as DecorationId];
    return { width: 0.6, depth: 0.6, height: 0 };
  }, [tool]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <ringGeometry args={[Math.max(size.width, size.depth) * 0.45, Math.max(size.width, size.depth) * 0.6, 28]} />
      <meshBasicMaterial color={valid ? "#4ab36a" : "#c14a3a"} transparent opacity={0.5} />
    </mesh>
  );
}

/** Resolves a pointer event to a placement cursor. */
export function useCursor() {
  const [cursor, setCursor] = useState<{ x: number; z: number; valid: boolean } | null>(null);

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!e.intersections.length) return;
    const p = e.point;
    const valid = withinIsland(p.x, p.z, 0.5) && sandHeight(p.x, p.z) > -0.4;
    setCursor({ x: p.x, z: p.z, valid });
  };
  const onLeave = () => setCursor(null);
  return { cursor, onMove, onLeave };
}

/** Place piece at the given cursor using current store tool. Returns true if placed. */
export function placeAtCursor(x: number, z: number): boolean {
  const s = useGame.getState();
  if (!withinIsland(x, z, 0.5)) return false;
  const y = sandHeight(x, z);
  if (y < -0.4) return false;

  const kind = classify(s.tool);
  if (kind === "erase") return false;

  const shape =
    kind === "mold"
      ? MOLD_SHAPES[s.tool as MoldId]
      : DECORATION_SHAPES[s.tool as DecorationId];

  s.addPiece({
    kind,
    variant: s.tool,
    position: [x, y, z],
    rotationY: s.rotation,
    scale: 1,
    baseY: y,
    height: shape.height,
  });
  return true;
}

export { ISLAND_RADIUS };
