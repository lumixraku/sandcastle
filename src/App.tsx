import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Scene } from "./components/Scene";
import { HUD } from "./components/HUD";

export default function App() {
  return (
    <>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMappingExposure: 1.25,
        }}
        camera={{ position: [18, 22, 22], fov: 32, near: 0.1, far: 500 }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <HUD />
    </>
  );
}
