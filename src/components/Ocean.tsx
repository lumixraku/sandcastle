import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../game/store";

/** y level of the water surface at low and high tide */
export const TIDE_MIN = -1.7;
export const TIDE_MAX = -0.05;

export function waterYFromTide(tide: number) {
  return TIDE_MIN + (TIDE_MAX - TIDE_MIN) * tide;
}

const vertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPos;
varying float vWaveH;
uniform float uTime;

float wave(vec2 p, vec2 dir, float wl, float amp, float speed) {
  return sin(dot(p, dir) * (6.2831 / wl) + uTime * speed) * amp;
}

void main() {
  vec3 p = position;
  vec2 xz = vec2(p.x, p.y); // plane is xy then rotated; we use xy here
  float h = 0.0;
  h += wave(xz, normalize(vec2( 1.0, 0.6)),  8.0, 0.05, 0.9);
  h += wave(xz, normalize(vec2(-0.7, 1.0)),  5.0, 0.03, 1.15);
  h += wave(xz, normalize(vec2( 0.4,-1.0)),  3.0, 0.018, 1.4);
  p.z += h;
  vWaveH = h;
  vUv = uv;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const fragmentShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPos;
varying float vWaveH;
uniform float uTime;
uniform vec3 uShallow;
uniform vec3 uDeep;
uniform vec3 uFoam;
uniform vec3 uFog;
uniform vec3 uSun;
uniform float uIsland;
uniform vec3 uCameraPos;

void main() {
  // distance from island center for depth gradient
  float d = length(vWorldPos.xz);
  float shoreEdge = smoothstep(uIsland - 0.6, uIsland + 1.8, d);
  vec3 base = mix(uShallow, uDeep, smoothstep(uIsland, uIsland + 22.0, d));

  vec3 col = base;
  // subtle brightening on crests (smooth, no thresholded foam)
  col = mix(col, uFoam, smoothstep(-0.02, 0.08, vWaveH) * 0.06);

  // shore foam glow — soft band right at the waterline
  float shoreBand = exp(-pow((d - uIsland - 0.05) / 0.45, 2.0));
  shoreBand *= 0.55 + 0.45 * sin(uTime * 0.6 + d * 0.6);
  col = mix(col, uFoam, clamp(shoreBand, 0.0, 1.0) * 0.4);

  // subtle vignette to deep
  col *= mix(1.0, 0.9, shoreEdge);

  // simple lambert-ish highlight
  float hi = clamp(dot(normalize(vec3(0.4, 1.0, 0.2)), normalize(uSun)), 0.0, 1.0);
  col += vec3(0.06) * hi;

  // distance fog: blend toward horizon/fog color so the ocean melts into the sky
  float camDist = length(vWorldPos - uCameraPos);
  float fogT = smoothstep(28.0, 110.0, camDist);
  col = mix(col, uFog, fogT);

  gl_FragColor = vec4(col, 1.0);
}
`;

interface Props {
  islandRadius: number;
}

export function Ocean({ islandRadius }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    // dense plane around the island, fog fades it out into the distance
    const g = new THREE.PlaneGeometry(140, 140, 280, 280);
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: false,
        uniforms: {
          uTime: { value: 0 },
          uShallow: { value: new THREE.Color("#8ddcd6") },
          uDeep: { value: new THREE.Color("#317fa0") },
          uFoam: { value: new THREE.Color("#f7fbf7") },
          uFog: { value: new THREE.Color("#cfe9ed") },
          uSun: { value: new THREE.Vector3(0.4, 1.0, 0.3) },
          uIsland: { value: islandRadius },
          uCameraPos: { value: new THREE.Vector3() },
        },
      }),
    [islandRadius]
  );

  useFrame((state, dt) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += dt;
      matRef.current.uniforms.uCameraPos.value.copy(state.camera.position);
    }
    const tide = useGame.getState().tide;
    if (meshRef.current) {
      // water rises with tide
      meshRef.current.position.y = waterYFromTide(tide);
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, TIDE_MIN, 0]}
      renderOrder={1}
    >
      <primitive object={material} ref={matRef} attach="material" />
    </mesh>
  );
}
