import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GradientSky } from "./Sky";
import { Beach } from "./Beach";
import { Ocean } from "./Ocean";
import { PlacedPieces } from "./PlacedPieces";
import { GhostPreview, placeAtCursor, useCursor } from "./Placer";
import { useGame } from "../game/store";
import { ISLAND_RADIUS } from "../game/terrain";

export function Scene() {
  const { cursor, onMove, onLeave } = useCursor();
  const tickTide = useGame((s) => s.tickTide);
  const sunRef = useRef<THREE.DirectionalLight>(null);

  useFrame((_, dt) => {
    tickTide(dt);
  });

  return (
    <>
      <color attach="background" args={["#bee2e6"]} />
      <fog attach="fog" args={["#bfe0e3", 50, 130]} />

      <GradientSky />

      {/* warm tropical key light */}
      <directionalLight
        ref={sunRef}
        position={[14, 18, 10]}
        intensity={1.6}
        color={"#ffe5c0"}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-bias={-0.0003}
      />
      <hemisphereLight args={["#cfe9f3", "#dbb37a", 0.75]} />
      <ambientLight intensity={0.35} />
      {/* warm bounce light from the sand */}
      <pointLight position={[0, 4, 0]} intensity={0.35} color={"#fbe4bf"} distance={28} decay={2} />

      <Beach
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          const p = e.point;
          placeAtCursor(p.x, p.z);
        }}
      />
      <Ocean islandRadius={ISLAND_RADIUS} />
      <PlacedPieces />
      <GhostPreview cursor={cursor} />

      <CameraRig />
      <OrbitControls
        makeDefault
        target={[0, 0.2, 0]}
        enablePan={false}
        minDistance={18}
        maxDistance={42}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2 - 0.25}
        rotateSpeed={0.55}
        zoomSpeed={0.7}
        dampingFactor={0.08}
      />
    </>
  );
}

/** Initial camera framing. */
function CameraRig() {
  const { camera } = useThree();
  const set = useRef(false);
  if (!set.current) {
    camera.position.set(20, 18, 22);
    camera.lookAt(0, 0.2, 0);
    set.current = true;
  }
  return null;
}
