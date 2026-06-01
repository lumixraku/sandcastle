import * as THREE from "three";

/** Procedural sand-grain canvas texture, used as a subtle normal/bump on castle pieces. */
let _sandTex: THREE.CanvasTexture | null = null;
export function sandGrainTexture(): THREE.CanvasTexture {
  if (_sandTex) return _sandTex;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  // base
  ctx.fillStyle = "#e7caa0";
  ctx.fillRect(0, 0, size, size);
  // grain
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const v = Math.random();
    const a = v * 0.18;
    ctx.fillStyle = v > 0.5 ? `rgba(70,40,15,${a})` : `rgba(255,240,210,${a})`;
    ctx.fillRect(x, y, 1.2, 1.2);
  }
  // faint brick lines
  ctx.strokeStyle = "rgba(80,55,30,0.07)";
  ctx.lineWidth = 1;
  for (let y = 0; y < size; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
  for (let x = 0; x < size; x += 32) {
    for (let y = 0; y < size; y += 24) {
      const offset = (y / 24) % 2 === 0 ? 0 : 16;
      ctx.beginPath();
      ctx.moveTo(x + offset, y);
      ctx.lineTo(x + offset, y + 24);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  _sandTex = tex;
  return tex;
}

let _waterCausticTex: THREE.CanvasTexture | null = null;
export function caustic(): THREE.CanvasTexture {
  if (_waterCausticTex) return _waterCausticTex;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    20,
    size / 2,
    size / 2,
    size / 2
  );
  grad.addColorStop(0, "rgba(255,255,255,0.5)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  _waterCausticTex = tex;
  return tex;
}
