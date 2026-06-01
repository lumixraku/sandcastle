import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ThreeEvent } from "@react-three/fiber";
import { ISLAND_RADIUS, sandHeight } from "../game/terrain";

interface Props {
  onPointerMove?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerLeave?: (e: ThreeEvent<PointerEvent>) => void;
}

/**
 * The sand island. A large disc heightmapped via sandHeight().
 * Includes a wet-sand ring around the shore (slightly darker, glossier).
 */
export function Beach({ onPointerMove, onPointerDown, onPointerLeave }: Props) {
  const mesh = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const size = ISLAND_RADIUS * 2.6;
    const segs = 220;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);

    const dry = new THREE.Color("#e9d3a3");
    const dryShade = new THREE.Color("#cfa974");
    const wet = new THREE.Color("#a98655");
    const deep = new THREE.Color("#6b513a");

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = sandHeight(x, z);
      pos.setY(i, h);

      const r = Math.sqrt(x * x + z * z);
      // shore band tint
      const shoreT = THREE.MathUtils.clamp(
        (r - (ISLAND_RADIUS - 2.2)) / 2.2,
        0,
        1
      );
      // height shading for dunes
      const dune = THREE.MathUtils.clamp((h - 0.0) / 0.5, 0, 1);
      const c = new THREE.Color();
      // dry → wet → deep across shoreT; dunes brighten dry
      if (r > ISLAND_RADIUS) c.copy(deep);
      else {
        const top = dry.clone().lerp(dryShade, 1 - dune);
        c.copy(top).lerp(wet, shoreT);
      }
      // tiny grain
      const grain = (Math.sin(x * 11.1 + z * 7.3) * 0.5 + 0.5) * 0.05;
      c.offsetHSL(0, 0, (grain - 0.025) * 0.6);

      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  const sandMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.95,
        metalness: 0.02,
        flatShading: false,
      }),
    []
  );

  // Faint subsurface — seafloor pillow below the sand so the moat looks dimensional.
  // Covers far past the island so we never see the sand plane corners.
  const seafloorGeo = useMemo(() => {
    const g = new THREE.CircleGeometry(60, 96);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  return (
    <group>
      <mesh
        ref={mesh}
        geometry={geometry}
        material={sandMat}
        position={[0, 0, 0]}
        receiveShadow
        castShadow
        name="sand"
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerLeave={onPointerLeave}
      />
      <mesh
        geometry={seafloorGeo}
        position={[0, -2.45, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#6e553c" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}
