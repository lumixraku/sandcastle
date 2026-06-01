import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { DecorationId } from "../game/store";

export const DECORATION_SHAPES: Record<DecorationId, { width: number; depth: number; height: number }> = {
  shell:     { width: 0.5, depth: 0.5, height: 0.18 },
  pebble:    { width: 0.45, depth: 0.45, height: 0.18 },
  driftwood: { width: 1.0, depth: 0.18, height: 0.2 },
  seaweed:   { width: 0.4, depth: 0.4, height: 0.7 },
  starfish:  { width: 0.55, depth: 0.55, height: 0.1 },
};

interface Props {
  variant: DecorationId;
  seed: number;
}

export function Decoration({ variant, seed }: Props) {
  switch (variant) {
    case "shell":     return <Shell seed={seed} />;
    case "pebble":    return <Pebbles seed={seed} />;
    case "driftwood": return <Driftwood seed={seed} />;
    case "seaweed":   return <Seaweed seed={seed} />;
    case "starfish":  return <Starfish seed={seed} />;
  }
}

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function Shell({ seed }: { seed: number }) {
  const r = rng(seed);
  const tint = useMemo(() => {
    const palette = ["#f6d8b4", "#f1c084", "#e7b7ce", "#dfe8c5", "#f4e5c5"];
    return palette[Math.floor(r() * palette.length)];
  }, [seed]);
  const geom = useMemo(() => {
    // half-ellipsoid scallop
    const g = new THREE.SphereGeometry(0.22, 22, 14, 0, Math.PI, 0, Math.PI / 2);
    g.scale(1, 0.45, 1.15);
    // radial grooves via vertex offset
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const ang = Math.atan2(z, x);
      const ridge = Math.sin(ang * 9) * 0.012;
      const ny = pos.getY(i);
      pos.setY(i, ny + ridge);
    }
    g.computeVertexNormals();
    return g;
  }, [seed]);
  return (
    <group rotation={[0, r() * Math.PI * 2, 0]}>
      <mesh geometry={geom} castShadow receiveShadow position={[0, 0.06, 0]}>
        <meshStandardMaterial color={tint} roughness={0.55} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Pebbles({ seed }: { seed: number }) {
  const r = rng(seed);
  const pebbles = useMemo(() => {
    const arr: { p: [number, number, number]; s: [number, number, number]; rot: number; c: string }[] = [];
    const colors = ["#9aa7b0", "#7e8a92", "#bdb0a0", "#736d68", "#aab8be"];
    const n = 3 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const d = r() * 0.18;
      arr.push({
        p: [Math.cos(a) * d, 0.04 + r() * 0.02, Math.sin(a) * d],
        s: [0.09 + r() * 0.05, 0.05 + r() * 0.03, 0.08 + r() * 0.05],
        rot: r() * Math.PI,
        c: colors[Math.floor(r() * colors.length)],
      });
    }
    return arr;
  }, [seed]);
  return (
    <group>
      {pebbles.map((p, i) => (
        <mesh key={i} castShadow receiveShadow position={p.p} scale={p.s} rotation={[0, p.rot, 0]}>
          <sphereGeometry args={[1, 14, 10]} />
          <meshStandardMaterial color={p.c} roughness={0.7} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
}

function Driftwood({ seed }: { seed: number }) {
  const r = rng(seed);
  const len = 0.55 + r() * 0.4;
  const rad = 0.06 + r() * 0.03;
  return (
    <group rotation={[0, r() * Math.PI, 0]} position={[0, rad * 0.8, 0]}>
      <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[rad, rad * 0.85, len, 10]} />
        <meshStandardMaterial color="#a48460" roughness={0.95} metalness={0} />
      </mesh>
      {/* knots */}
      <mesh castShadow receiveShadow position={[len * 0.25, 0, 0]}>
        <sphereGeometry args={[rad * 1.05, 10, 8]} />
        <meshStandardMaterial color="#866041" roughness={0.95} />
      </mesh>
      {r() > 0.5 && (
        <mesh castShadow receiveShadow position={[-len * 0.35, 0, 0]}>
          <sphereGeometry args={[rad * 0.95, 10, 8]} />
          <meshStandardMaterial color="#866041" roughness={0.95} />
        </mesh>
      )}
    </group>
  );
}

function Seaweed({ seed }: { seed: number }) {
  const r = rng(seed);
  const fronds = useMemo(() => {
    const arr: { rot: number; h: number; off: number; tint: string }[] = [];
    const n = 4 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      arr.push({
        rot: r() * Math.PI * 2,
        h: 0.45 + r() * 0.3,
        off: r() * 0.08,
        tint: r() > 0.5 ? "#3e7f4d" : "#5a8d3a",
      });
    }
    return arr;
  }, [seed]);
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      child.rotation.z = Math.sin(t * 1.5 + i) * 0.08;
    });
  });
  return (
    <group ref={groupRef}>
      {fronds.map((f, i) => (
        <mesh key={i} castShadow position={[Math.cos(f.rot) * f.off, f.h / 2, Math.sin(f.rot) * f.off]} rotation={[0, f.rot, 0]}>
          <planeGeometry args={[0.08, f.h]} />
          <meshStandardMaterial color={f.tint} roughness={0.75} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Starfish({ seed }: { seed: number }) {
  const r = rng(seed);
  const tint = r() > 0.5 ? "#d96a4a" : "#e08a52";
  const geom = useMemo(() => {
    const shape = new THREE.Shape();
    const arms = 5;
    const outer = 0.22;
    const inner = 0.085;
    for (let i = 0; i < arms * 2; i++) {
      const a = (i / (arms * 2)) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 === 0 ? outer : inner;
      const x = Math.cos(a) * rad;
      const y = Math.sin(a) * rad;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.03,
      bevelSegments: 3,
      curveSegments: 6,
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [seed]);
  return (
    <group rotation={[0, r() * Math.PI * 2, 0]}>
      <mesh geometry={geom} castShadow receiveShadow position={[0, 0.025, 0]}>
        <meshStandardMaterial color={tint} roughness={0.7} />
      </mesh>
    </group>
  );
}
