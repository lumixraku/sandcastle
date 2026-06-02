import * as THREE from "three";
import { sandGrainTexture } from "./textures";

let _sandMat: THREE.MeshStandardMaterial | null = null;
let _sandMatDark: THREE.MeshStandardMaterial | null = null;
let _wetSandMat: THREE.MeshStandardMaterial | null = null;
let _ghostSandMat: THREE.MeshStandardMaterial | null = null;
let _ghostDarkMat: THREE.MeshStandardMaterial | null = null;

export function sandMaterial(): THREE.MeshStandardMaterial {
  if (_sandMat) return _sandMat;
  const tex = sandGrainTexture();
  const m = new THREE.MeshStandardMaterial({
    color: "#ecd0a1",
    roughness: 0.92,
    metalness: 0,
    map: tex,
  });
  m.map!.repeat.set(2, 2);
  _sandMat = m;
  return m;
}

/** Slightly darker / shadowed variant for inner recesses on molds. */
export function sandMaterialDark(): THREE.MeshStandardMaterial {
  if (_sandMatDark) return _sandMatDark;
  const m = sandMaterial().clone();
  m.color = new THREE.Color("#b48f5b");
  m.map = sandMaterial().map; // share texture
  _sandMatDark = m;
  return m;
}

/** Wet darker sand — for pieces near or below the tide line. */
export function wetSandMaterial(): THREE.MeshStandardMaterial {
  if (_wetSandMat) return _wetSandMat;
  const m = sandMaterial().clone();
  m.color = new THREE.Color("#8a6a44");
  m.roughness = 0.55;
  m.map = sandMaterial().map;
  _wetSandMat = m;
  return m;
}

/**
 * Separate materials used exclusively by the placement ghost. They share the
 * sand texture but live as independent instances, so the ghost's translucency
 * and emissive tint never bleed into the real, placed pieces.
 */
export function ghostSandMaterial(): THREE.MeshStandardMaterial {
  if (_ghostSandMat) return _ghostSandMat;
  const base = sandMaterial();
  const m = new THREE.MeshStandardMaterial({
    color: base.color.clone(),
    roughness: base.roughness,
    metalness: base.metalness,
    map: base.map,
    transparent: true,
    depthWrite: false,
    opacity: 0.65,
  });
  _ghostSandMat = m;
  return m;
}

export function ghostSandDarkMaterial(): THREE.MeshStandardMaterial {
  if (_ghostDarkMat) return _ghostDarkMat;
  const base = sandMaterialDark();
  const m = new THREE.MeshStandardMaterial({
    color: base.color.clone(),
    roughness: base.roughness,
    metalness: base.metalness,
    map: base.map,
    transparent: true,
    depthWrite: false,
    opacity: 0.65,
  });
  _ghostDarkMat = m;
  return m;
}
