import { useMemo } from "react";
import * as THREE from "three";
import { MoldId } from "../game/store";
import {
  sandMaterial,
  sandMaterialDark,
  wetSandMaterial,
  ghostSandMaterial,
  ghostSandDarkMaterial,
} from "../game/materials";

/** Visual + collider dimensions of a mold variant. */
export interface MoldShape {
  /** approximate footprint width/depth (for placement spacing) */
  width: number;
  depth: number;
  /** height from base to top */
  height: number;
}

export const MOLD_SHAPES: Record<MoldId, MoldShape> = {
  "square-tower": { width: 1.6, depth: 1.6, height: 2.1 },
  "round-tower":  { width: 1.5, depth: 1.5, height: 2.0 },
  wall:           { width: 2.6, depth: 0.6, height: 1.0 },
  "wall-corner":  { width: 1.6, depth: 1.6, height: 1.0 },
  gate:           { width: 3.0, depth: 0.7, height: 1.4 },
  mound:          { width: 1.8, depth: 1.8, height: 0.7 },
  flag:           { width: 0.2, depth: 0.2, height: 1.2 },
};

interface Props {
  variant: MoldId;
  /** how submerged the piece is (0 dry → 1 fully soaked). Visual only. */
  wetness?: number;
  /** Renders with translucent ghost-specific materials (used by placement preview). */
  ghost?: boolean;
}

/**
 * All molds are built procedurally from primitives. Placed pieces use cached
 * sand materials; the ghost preview uses its own dedicated material instances
 * (ghostSandMaterial / ghostSandDarkMaterial) so its translucency stays isolated.
 */
export function CastlePiece({ variant, wetness = 0, ghost = false }: Props) {
  const sand = sandMaterial();
  const dark = sandMaterialDark();
  const wet = wetSandMaterial();

  const baseMat = ghost
    ? ghostSandMaterial()
    : wetness > 0.5
      ? wet
      : sand;
  const accentMat = ghost
    ? ghostSandDarkMaterial()
    : wetness > 0.5
      ? wet
      : dark;

  switch (variant) {
    case "square-tower": return <SquareTower base={baseMat} accent={accentMat} />;
    case "round-tower":  return <RoundTower base={baseMat} accent={accentMat} />;
    case "wall":         return <Wall base={baseMat} accent={accentMat} />;
    case "wall-corner":  return <WallCorner base={baseMat} accent={accentMat} />;
    case "gate":         return <Gate base={baseMat} accent={accentMat} />;
    case "mound":        return <Mound base={baseMat} />;
    case "flag":         return <Flag />;
  }
}

/* ------------------------------- pieces ---------------------------------- */

function SquareTower({ base, accent }: { base: THREE.Material; accent: THREE.Material }) {
  const merlons = useMemo(() => makeMerlonsSquare(0.78, 4), []);
  return (
    <group>
      {/* battered body (slight taper) */}
      <mesh material={base} castShadow receiveShadow position={[0, 0.8, 0]}>
        <boxGeometry args={[1.4, 1.6, 1.4]} />
      </mesh>
      {/* top trim plate */}
      <mesh material={accent} castShadow receiveShadow position={[0, 1.66, 0]}>
        <boxGeometry args={[1.52, 0.08, 1.52]} />
      </mesh>
      {/* merlons */}
      <group position={[0, 1.78, 0]}>
        {merlons.map((m, i) => (
          <mesh
            key={i}
            material={base}
            castShadow
            receiveShadow
            position={[m.x, 0, m.z]}
          >
            <boxGeometry args={[0.2, 0.24, 0.2]} />
          </mesh>
        ))}
      </group>
      {/* door (decorative recess) */}
      <mesh material={accent} position={[0, 0.4, 0.71]}>
        <boxGeometry args={[0.32, 0.55, 0.02]} />
      </mesh>
    </group>
  );
}

function RoundTower({ base, accent }: { base: THREE.Material; accent: THREE.Material }) {
  const merlons = useMemo(() => {
    const arr: { x: number; z: number; y: number }[] = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      if (i % 2 === 1) continue; // gap between merlons
      const a = (i / count) * Math.PI * 2;
      arr.push({ x: Math.cos(a) * 0.74, z: Math.sin(a) * 0.74, y: a });
    }
    return arr;
  }, []);
  return (
    <group>
      <mesh material={base} castShadow receiveShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.7, 0.78, 1.6, 28]} />
      </mesh>
      <mesh material={accent} castShadow receiveShadow position={[0, 1.66, 0]}>
        <cylinderGeometry args={[0.82, 0.82, 0.08, 28]} />
      </mesh>
      <group position={[0, 1.79, 0]}>
        {merlons.map((m, i) => (
          <mesh
            key={i}
            material={base}
            castShadow
            receiveShadow
            position={[m.x, 0, m.z]}
            rotation={[0, -m.y, 0]}
          >
            <boxGeometry args={[0.18, 0.24, 0.22]} />
          </mesh>
        ))}
      </group>
      <mesh material={accent} position={[0, 0.4, 0.7]}>
        <boxGeometry args={[0.3, 0.55, 0.02]} />
      </mesh>
    </group>
  );
}

function Wall({ base, accent }: { base: THREE.Material; accent: THREE.Material }) {
  const merlons = useMemo(() => makeMerlonsLine(5, 2.2), []);
  return (
    <group>
      <mesh material={base} castShadow receiveShadow position={[0, 0.42, 0]}>
        <boxGeometry args={[2.5, 0.84, 0.5]} />
      </mesh>
      <mesh material={accent} castShadow receiveShadow position={[0, 0.88, 0]}>
        <boxGeometry args={[2.62, 0.06, 0.58]} />
      </mesh>
      <group position={[0, 1.0, 0]}>
        {merlons.map((m, i) => (
          <mesh key={i} material={base} castShadow receiveShadow position={[m, 0, 0]}>
            <boxGeometry args={[0.22, 0.2, 0.5]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function WallCorner({ base, accent }: { base: THREE.Material; accent: THREE.Material }) {
  return (
    <group>
      {/* arm A along +x */}
      <group position={[0.45, 0, 0]}>
        <mesh material={base} castShadow receiveShadow position={[0, 0.42, 0]}>
          <boxGeometry args={[1.4, 0.84, 0.5]} />
        </mesh>
        <mesh material={accent} castShadow receiveShadow position={[0, 0.88, 0]}>
          <boxGeometry args={[1.5, 0.06, 0.58]} />
        </mesh>
        {makeMerlonsLine(3, 1.2).map((m, i) => (
          <mesh key={i} material={base} castShadow receiveShadow position={[m, 1.0, 0]}>
            <boxGeometry args={[0.2, 0.2, 0.5]} />
          </mesh>
        ))}
      </group>
      {/* arm B along +z */}
      <group position={[0, 0, 0.45]} rotation={[0, Math.PI / 2, 0]}>
        <mesh material={base} castShadow receiveShadow position={[0, 0.42, 0]}>
          <boxGeometry args={[1.4, 0.84, 0.5]} />
        </mesh>
        <mesh material={accent} castShadow receiveShadow position={[0, 0.88, 0]}>
          <boxGeometry args={[1.5, 0.06, 0.58]} />
        </mesh>
        {makeMerlonsLine(3, 1.2).map((m, i) => (
          <mesh key={i} material={base} castShadow receiveShadow position={[m, 1.0, 0]}>
            <boxGeometry args={[0.2, 0.2, 0.5]} />
          </mesh>
        ))}
      </group>
      {/* corner cube */}
      <mesh material={base} castShadow receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[0.7, 1.0, 0.7]} />
      </mesh>
      <mesh material={accent} castShadow receiveShadow position={[0, 1.04, 0]}>
        <boxGeometry args={[0.78, 0.06, 0.78]} />
      </mesh>
      <mesh material={base} castShadow receiveShadow position={[0, 1.18, 0]}>
        <boxGeometry args={[0.24, 0.24, 0.24]} />
      </mesh>
    </group>
  );
}

function Gate({ base, accent }: { base: THREE.Material; accent: THREE.Material }) {
  return (
    <group>
      {/* two side pillars */}
      <mesh material={base} castShadow receiveShadow position={[-1.05, 0.55, 0]}>
        <boxGeometry args={[0.7, 1.1, 0.6]} />
      </mesh>
      <mesh material={base} castShadow receiveShadow position={[1.05, 0.55, 0]}>
        <boxGeometry args={[0.7, 1.1, 0.6]} />
      </mesh>
      {/* connecting walls below archway */}
      <mesh material={base} castShadow receiveShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[1.55, 0.5, 0.6]} />
      </mesh>
      {/* lintel above gate */}
      <mesh material={base} castShadow receiveShadow position={[0, 1.0, 0]}>
        <boxGeometry args={[1.55, 0.3, 0.6]} />
      </mesh>
      {/* archway opening (visual recess) */}
      <mesh material={accent} position={[0, 0.65, 0]}>
        <boxGeometry args={[1.0, 0.7, 0.4]} />
      </mesh>
      {/* battlement plates */}
      <mesh material={accent} castShadow receiveShadow position={[-1.05, 1.16, 0]}>
        <boxGeometry args={[0.78, 0.06, 0.66]} />
      </mesh>
      <mesh material={accent} castShadow receiveShadow position={[1.05, 1.16, 0]}>
        <boxGeometry args={[0.78, 0.06, 0.66]} />
      </mesh>
      <mesh material={accent} castShadow receiveShadow position={[0, 1.18, 0]}>
        <boxGeometry args={[1.6, 0.06, 0.66]} />
      </mesh>
      {/* merlons over side towers */}
      {[-1.32, -1.05, -0.78].map((x, i) => (
        <mesh key={`L${i}`} material={base} castShadow receiveShadow position={[x, 1.3, 0]}>
          <boxGeometry args={[0.18, 0.22, 0.6]} />
        </mesh>
      ))}
      {[0.78, 1.05, 1.32].map((x, i) => (
        <mesh key={`R${i}`} material={base} castShadow receiveShadow position={[x, 1.3, 0]}>
          <boxGeometry args={[0.18, 0.22, 0.6]} />
        </mesh>
      ))}
      {/* central low merlons */}
      {[-0.45, 0, 0.45].map((x, i) => (
        <mesh key={`C${i}`} material={base} castShadow receiveShadow position={[x, 1.28, 0]}>
          <boxGeometry args={[0.18, 0.18, 0.6]} />
        </mesh>
      ))}
    </group>
  );
}

function Mound({ base }: { base: THREE.Material }) {
  return (
    <group>
      <mesh
        material={base}
        castShadow
        receiveShadow
        position={[0, 0.05, 0]}
        scale={[1, 0.45, 1]}
      >
        <sphereGeometry args={[0.9, 22, 14]} />
      </mesh>
      <mesh
        material={base}
        castShadow
        receiveShadow
        position={[0.35, 0.05, 0.15]}
        scale={[1, 0.35, 1]}
      >
        <sphereGeometry args={[0.4, 18, 12]} />
      </mesh>
    </group>
  );
}

function Flag() {
  return (
    <group>
      {/* pole */}
      <mesh castShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
        <meshStandardMaterial color="#7a5a35" roughness={0.8} />
      </mesh>
      {/* finial */}
      <mesh castShadow position={[0, 1.22, 0]}>
        <sphereGeometry args={[0.05, 12, 8]} />
        <meshStandardMaterial color="#dccda0" roughness={0.5} />
      </mesh>
      {/* triangular flag */}
      <mesh castShadow position={[0.18, 1.0, 0]}>
        <FlagGeometry />
        <meshStandardMaterial color="#c1432e" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function FlagGeometry() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // simple triangle flag
    const verts = new Float32Array([
      0, 0.12, 0,
      0, -0.12, 0,
      0.35, 0, 0,
    ]);
    g.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    g.setIndex([0, 1, 2]);
    g.computeVertexNormals();
    return g;
  }, []);
  return <primitive object={geo} attach="geometry" />;
}

/* ----------------------------- helpers ----------------------------------- */

function makeMerlonsSquare(half: number, perSide: number) {
  // place merlons around the rim of a half x half square
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
}

function makeMerlonsLine(count: number, length: number) {
  const arr: number[] = [];
  const step = length / (count - 1);
  for (let i = 0; i < count; i++) arr.push(-length / 2 + i * step);
  return arr;
}
