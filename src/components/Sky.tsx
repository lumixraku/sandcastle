import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

/**
 * Full-screen sky. Renders a fullscreen quad behind everything and reconstructs
 * the per-pixel view direction in the fragment shader — so the sky is perfectly
 * smooth regardless of geometry tessellation.
 */
const vert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 1.0, 1.0); // z=1 → far plane
}
`;

const frag = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform mat4 uInvProj;
uniform mat4 uInvView;
uniform vec3 uTop;
uniform vec3 uMid;
uniform vec3 uHorizon;
uniform vec3 uSunDir;
uniform vec3 uSunColor;

vec3 viewDir() {
  vec2 ndc = vUv * 2.0 - 1.0;
  vec4 clip = vec4(ndc, 1.0, 1.0);
  vec4 view = uInvProj * clip;
  view /= view.w;
  vec4 world = uInvView * vec4(view.xyz, 0.0);
  return normalize(world.xyz);
}

void main() {
  vec3 dir = viewDir();
  float y = clamp(dir.y, -1.0, 1.0);

  // band 1: deep top -> mid sky
  vec3 sky = mix(uMid, uTop, smoothstep(0.05, 0.7, y));
  // band 2: mid -> warm horizon
  sky = mix(uHorizon, sky, smoothstep(-0.02, 0.18, y));

  // sun + soft glow
  float d = max(dot(dir, uSunDir), 0.0);
  sky += uSunColor * pow(d, 1200.0) * 8.0;        // tiny disk
  sky += uSunColor * pow(d, 12.0) * 0.18;          // wide bloom

  // below horizon fade
  if (y < 0.0) {
    sky = mix(sky, uHorizon * 0.85, clamp(-y * 3.0, 0.0, 1.0));
  }

  gl_FragColor = vec4(sky, 1.0);
}
`;

export function GradientSky() {
  const { camera } = useThree();
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uInvProj: { value: new THREE.Matrix4() },
          uInvView: { value: new THREE.Matrix4() },
          uTop: { value: new THREE.Color("#bce0ed") },
          uMid: { value: new THREE.Color("#dff0f4") },
          uHorizon: { value: new THREE.Color("#fcecd0") },
          uSunDir: { value: new THREE.Vector3(0.55, 0.55, 0.4).normalize() },
          uSunColor: { value: new THREE.Color("#fff3cf") },
        },
      }),
    []
  );

  useFrame(() => {
    if (!matRef.current) return;
    matRef.current.uniforms.uInvProj.value
      .copy(camera.projectionMatrix)
      .invert();
    matRef.current.uniforms.uInvView.value
      .copy(camera.matrixWorldInverse)
      .invert();
  });

  return (
    <mesh frustumCulled={false} renderOrder={-1000}>
      <planeGeometry args={[2, 2]} />
      <primitive ref={matRef} object={material} attach="material" />
    </mesh>
  );
}
