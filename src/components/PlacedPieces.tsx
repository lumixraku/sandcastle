import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useGame, Piece, MoldId, DecorationId } from "../game/store";
import { CastlePiece } from "./CastlePiece";
import { Decoration } from "./Decoration";
import { waterYFromTide } from "./Ocean";
import { sandMaterial, sandMaterialDark } from "../game/materials";

/** Max simultaneous square towers — sets the instance buffer capacity. */
const MAX_SQUARE_TOWERS = 200;

/** Local-space offsets of the 8 merlons on a square tower (matches CastlePiece). */
const SQUARE_TOWER_MERLONS: { x: number; z: number }[] = (() => {
  const half = 0.78;
  const perSide = 4;
  const arr: { x: number; z: number }[] = [];
  const step = (half * 2) / perSide;
  for (let i = 0; i <= perSide; i++) {
    const t = -half + i * step;
    if (i % 2 === 0) {
      arr.push({ x: t, z: -half });
      arr.push({ x: t, z: half });
      if (i !== 0 && i !== perSide) {
        arr.push({ x: -half, z: t });
        arr.push({ x: half, z: t });
      }
    }
  }
  return arr;
})();
const MERLONS_PER_TOWER = SQUARE_TOWER_MERLONS.length;

/** Render all placed pieces. Square towers go through an instanced fast path. */
export function PlacedPieces() {
  const pieces = useGame((s) => s.pieces);
  const tool = useGame((s) => s.tool);
  const removePiece = useGame((s) => s.removePiece);

  const squareTowers = useMemo(
    () => pieces.filter((p) => p.kind === "mold" && p.variant === "square-tower"),
    [pieces]
  );
  const others = useMemo(
    () => pieces.filter((p) => !(p.kind === "mold" && p.variant === "square-tower")),
    [pieces]
  );

  return (
    <group>
      {others.map((p) => (
        <PieceMesh
          key={p.id}
          piece={p}
          erasing={tool === "erase"}
          onErase={() => removePiece(p.id)}
        />
      ))}
      <SquareTowerInstances
        pieces={squareTowers}
        erasing={tool === "erase"}
        onErase={removePiece}
      />
    </group>
  );
}

function PieceMesh({
  piece,
  erasing,
  onErase,
}: {
  piece: Piece;
  erasing: boolean;
  onErase: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);

  useFrame(() => {
    const tide = useGame.getState().tide;
    const waterY = waterYFromTide(tide);
    // Wetness ramps as the water reaches the piece base
    const wet = THREE.MathUtils.clamp(
      (waterY - piece.baseY + 0.05) / 0.3,
      0,
      1
    );
    // Submerge & melt: when water rises above half the piece's height, sink it slightly
    const submerge = Math.max(0, waterY - (piece.baseY + piece.height * 0.55));
    // gentle sink that knocks it down eventually
    const sink = Math.min(piece.height * 0.9, submerge * 1.5);
    if (group.current) {
      group.current.position.y = piece.baseY - sink;
      // small wobble as it gets soggy
      const wobble = wet * 0.04;
      group.current.rotation.x = Math.sin(performance.now() * 0.0015 + piece.seed) * wobble;
      group.current.rotation.z = Math.cos(performance.now() * 0.0017 + piece.seed) * wobble;
      // store wetness for child material swap
      (group.current.userData as any).wet = wet;

      // visual erase hint
      const scale = erasing && hover ? 1.04 : 1;
      group.current.scale.setScalar(scale);
    }
  });

  return (
    <group
      ref={group}
      position={piece.position}
      rotation={[0, piece.rotationY, 0]}
      onPointerOver={(e) => {
        if (!erasing) return;
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "";
      }}
      onPointerDown={(e) => {
        if (!erasing) return;
        e.stopPropagation();
        onErase();
      }}
    >
      {piece.kind === "mold" ? (
        <CastlePiece variant={piece.variant as MoldId} />
      ) : (
        <Decoration variant={piece.variant as DecorationId} seed={piece.seed} />
      )}
    </group>
  );
}

/**
 * All square towers rendered as 4 InstancedMesh groups (body, top trim, merlons,
 * door). N towers = 4 draw calls instead of N * 11.
 *
 * Tradeoff: the wet-material swap is approximated via per-instance color tint
 * (setColorAt) since instanced meshes share a single material. Per-instance
 * sink + wobble still work — they're encoded into the instance matrix each frame.
 */
function SquareTowerInstances({
  pieces,
  erasing,
  onErase,
}: {
  pieces: Piece[];
  erasing: boolean;
  onErase: (id: string) => void;
}) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const topRef = useRef<THREE.InstancedMesh>(null);
  const merlonRef = useRef<THREE.InstancedMesh>(null);
  const doorRef = useRef<THREE.InstancedMesh>(null);

  // Per-instance materials: white base color so setColorAt tints fully.
  // Texture map carries over from sandMaterial so the grain is preserved.
  const bodyMat = useMemo(() => {
    const m = sandMaterial().clone();
    m.color.set("#ffffff");
    return m;
  }, []);
  const accentMat = useMemo(() => {
    const m = sandMaterialDark().clone();
    m.color.set("#ffffff");
    return m;
  }, []);

  // Reused scratch objects to avoid per-frame allocations.
  const scratch = useMemo(
    () => ({
      mat: new THREE.Matrix4(),
      piece: new THREE.Matrix4(),
      pos: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      eul: new THREE.Euler(),
      scl: new THREE.Vector3(1, 1, 1),
      dryBody: new THREE.Color("#ecd0a1"),
      wetBody: new THREE.Color("#8a6a44"),
      dryAccent: new THREE.Color("#b48f5b"),
      wetAccent: new THREE.Color("#8a6a44"),
      bodyColor: new THREE.Color(),
      accentColor: new THREE.Color(),
    }),
    []
  );

  useFrame(() => {
    const tide = useGame.getState().tide;
    const waterY = waterYFromTide(tide);
    const s = scratch;
    const n = Math.min(pieces.length, MAX_SQUARE_TOWERS);

    const body = bodyRef.current;
    const top = topRef.current;
    const merlon = merlonRef.current;
    const door = doorRef.current;
    if (!body || !top || !merlon || !door) return;

    for (let i = 0; i < n; i++) {
      const p = pieces[i];
      const wet = THREE.MathUtils.clamp(
        (waterY - p.baseY + 0.05) / 0.3,
        0,
        1
      );
      const submerge = Math.max(0, waterY - (p.baseY + p.height * 0.55));
      const sink = Math.min(p.height * 0.9, submerge * 1.5);
      const wobble = wet * 0.04;
      const t = performance.now();
      const rx = Math.sin(t * 0.0015 + p.seed) * wobble;
      const rz = Math.cos(t * 0.0017 + p.seed) * wobble;

      s.pos.set(p.position[0], p.baseY - sink, p.position[2]);
      s.eul.set(rx, p.rotationY, rz);
      s.quat.setFromEuler(s.eul);
      s.piece.compose(s.pos, s.quat, s.scl);

      // body @ (0, 0.8, 0)
      s.mat.makeTranslation(0, 0.8, 0).premultiply(s.piece);
      body.setMatrixAt(i, s.mat);

      // top trim @ (0, 1.66, 0)
      s.mat.makeTranslation(0, 1.66, 0).premultiply(s.piece);
      top.setMatrixAt(i, s.mat);

      // merlons @ (mx, 1.78, mz)
      for (let j = 0; j < MERLONS_PER_TOWER; j++) {
        const m = SQUARE_TOWER_MERLONS[j];
        s.mat.makeTranslation(m.x, 1.78, m.z).premultiply(s.piece);
        merlon.setMatrixAt(i * MERLONS_PER_TOWER + j, s.mat);
      }

      // door @ (0, 0.4, 0.71)
      s.mat.makeTranslation(0, 0.4, 0.71).premultiply(s.piece);
      door.setMatrixAt(i, s.mat);

      // Per-instance tint: lerp dry→wet on the smooth 0..1 wetness.
      s.bodyColor.copy(s.dryBody).lerp(s.wetBody, wet);
      s.accentColor.copy(s.dryAccent).lerp(s.wetAccent, wet);
      body.setColorAt(i, s.bodyColor);
      top.setColorAt(i, s.accentColor);
      door.setColorAt(i, s.accentColor);
      for (let j = 0; j < MERLONS_PER_TOWER; j++) {
        merlon.setColorAt(i * MERLONS_PER_TOWER + j, s.bodyColor);
      }
    }

    body.count = n;
    top.count = n;
    merlon.count = n * MERLONS_PER_TOWER;
    door.count = n;

    body.instanceMatrix.needsUpdate = true;
    top.instanceMatrix.needsUpdate = true;
    merlon.instanceMatrix.needsUpdate = true;
    door.instanceMatrix.needsUpdate = true;
    if (body.instanceColor) body.instanceColor.needsUpdate = true;
    if (top.instanceColor) top.instanceColor.needsUpdate = true;
    if (merlon.instanceColor) merlon.instanceColor.needsUpdate = true;
    if (door.instanceColor) door.instanceColor.needsUpdate = true;
  });

  const eraseFromInstance = (e: any, perTower: number) => {
    if (!erasing) return;
    e.stopPropagation();
    const instanceId = e.instanceId as number | undefined;
    if (instanceId == null) return;
    const pieceIdx = Math.floor(instanceId / perTower);
    const piece = pieces[pieceIdx];
    if (piece) onErase(piece.id);
  };

  return (
    <group>
      <instancedMesh
        ref={bodyRef}
        args={[undefined as any, undefined as any, MAX_SQUARE_TOWERS]}
        castShadow
        receiveShadow
        material={bodyMat}
        onPointerDown={(e) => eraseFromInstance(e, 1)}
      >
        <boxGeometry args={[1.4, 1.6, 1.4]} />
      </instancedMesh>
      <instancedMesh
        ref={topRef}
        args={[undefined as any, undefined as any, MAX_SQUARE_TOWERS]}
        castShadow
        receiveShadow
        material={accentMat}
        onPointerDown={(e) => eraseFromInstance(e, 1)}
      >
        <boxGeometry args={[1.52, 0.08, 1.52]} />
      </instancedMesh>
      <instancedMesh
        ref={merlonRef}
        args={[undefined as any, undefined as any, MAX_SQUARE_TOWERS * MERLONS_PER_TOWER]}
        castShadow
        receiveShadow
        material={bodyMat}
        onPointerDown={(e) => eraseFromInstance(e, MERLONS_PER_TOWER)}
      >
        <boxGeometry args={[0.2, 0.24, 0.2]} />
      </instancedMesh>
      <instancedMesh
        ref={doorRef}
        args={[undefined as any, undefined as any, MAX_SQUARE_TOWERS]}
        material={accentMat}
        onPointerDown={(e) => eraseFromInstance(e, 1)}
      >
        <boxGeometry args={[0.32, 0.55, 0.02]} />
      </instancedMesh>
    </group>
  );
}
