// Deterministic island heightmap. Center high, edges plunge into water.
// One shared function so click-raycast results agree with the rendered mesh.

const TAU = Math.PI * 2;

function hash(x: number, y: number): number {
  let h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return h - Math.floor(h);
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return (
    a * (1 - ux) * (1 - uy) +
    b * ux * (1 - uy) +
    c * (1 - ux) * uy +
    d * ux * uy
  );
}

/** Island radius — also the placement bound. */
export const ISLAND_RADIUS = 10;
/** Highest sand altitude at the center. */
export const SAND_PEAK = 0.6;
/** Below this y the surface is below the seabed. */
export const SEAFLOOR = -2.4;

/**
 * Height of the sand surface at (x, z). Returns -Infinity outside the island.
 * Continuous, smooth radial falloff with low-amplitude noise.
 */
export function sandHeight(x: number, z: number): number {
  const r = Math.sqrt(x * x + z * z);
  // Outside the island, dive sharply below the seabed so the plane edge
  // is never visible through the water.
  if (r > ISLAND_RADIUS) {
    const k = Math.min(1, (r - ISLAND_RADIUS) / 4);
    return SEAFLOOR - 0.5 - k * 6;
  }

  // Radial profile: high plateau center, then a beach slope into water.
  const t = r / ISLAND_RADIUS; // 0..1
  // smoothstep-ish: stays near peak in center, then dips
  const plateau = 1 - t * t * t;
  let h = SEAFLOOR + (SAND_PEAK - SEAFLOOR) * plateau;

  // Soft dune noise (very low amplitude so molds sit on flat-ish surfaces)
  const n =
    smoothNoise(x * 0.35 + 12.3, z * 0.35 - 4.7) * 0.6 +
    smoothNoise(x * 0.9 - 7.1, z * 0.9 + 9.4) * 0.25;
  // Fade noise to zero at the shoreline so we don't get jagged coast
  const shoreFade = Math.max(0, 1 - Math.pow(t, 4));
  h += (n - 0.45) * 0.18 * shoreFade;

  return h;
}

export function withinIsland(x: number, z: number, margin = 0.4): boolean {
  return Math.sqrt(x * x + z * z) < ISLAND_RADIUS - margin;
}

/** Angle from center, used by some decoration variants */
export function angle(x: number, z: number): number {
  let a = Math.atan2(z, x);
  if (a < 0) a += TAU;
  return a;
}
