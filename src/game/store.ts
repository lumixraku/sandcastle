import { create } from "zustand";

export type MoldId =
  | "square-tower"
  | "round-tower"
  | "wall"
  | "wall-corner"
  | "gate"
  | "mound"
  | "flag";

export type DecorationId =
  | "shell"
  | "pebble"
  | "driftwood"
  | "seaweed"
  | "starfish";

export type ToolId = MoldId | DecorationId | "erase";

export type ToolKind = "mold" | "decoration" | "erase";

export interface Piece {
  id: string;
  kind: ToolKind;
  variant: ToolId;
  position: [number, number, number];
  rotationY: number;
  scale: number;
  /** y of the bottom of the piece relative to sand surface — used for tide submersion */
  baseY: number;
  /** approximate top height in world units, for tide knockdown checks */
  height: number;
  /** persistent seed for procedural variants */
  seed: number;
}

interface GameState {
  pieces: Piece[];
  tool: ToolId;
  rotation: number;
  /** 0 (dead-low) .. 1 (king-tide). Auto-rises if running. */
  tide: number;
  tideRunning: boolean;
  tideSpeed: number;
  /** Sand-island radius for placement bounds */
  islandRadius: number;

  setTool: (t: ToolId) => void;
  rotate: (delta: number) => void;
  setRotation: (r: number) => void;

  addPiece: (p: Omit<Piece, "id" | "seed"> & Partial<Pick<Piece, "id" | "seed">>) => void;
  removePiece: (id: string) => void;
  clearPieces: () => void;

  setTide: (n: number) => void;
  tickTide: (dt: number) => void;
  setTideRunning: (r: boolean) => void;
}

let pieceCounter = 0;

export const useGame = create<GameState>((set, get) => ({
  pieces: [],
  tool: "square-tower",
  rotation: 0,
  tide: 0.12,
  tideRunning: true,
  tideSpeed: 0.012, // takes ~1.5 min from 0 to 1
  islandRadius: 9,

  setTool: (t) => set({ tool: t }),
  rotate: (delta) =>
    set((s) => ({ rotation: (s.rotation + delta) % (Math.PI * 2) })),
  setRotation: (r) => set({ rotation: r }),

  addPiece: (p) =>
    set((s) => ({
      pieces: [
        ...s.pieces,
        {
          ...p,
          id: p.id ?? `p${++pieceCounter}`,
          seed: p.seed ?? Math.random() * 1000,
        } as Piece,
      ],
    })),
  removePiece: (id) =>
    set((s) => ({ pieces: s.pieces.filter((p) => p.id !== id) })),
  clearPieces: () => set({ pieces: [] }),

  setTide: (n) => set({ tide: Math.max(0, Math.min(1, n)) }),
  tickTide: (dt) => {
    const s = get();
    if (!s.tideRunning) return;
    const next = s.tide + dt * s.tideSpeed;
    // gentle oscillation past full: ease into king-tide and stay
    set({ tide: Math.min(1, next) });
  },
  setTideRunning: (r) => set({ tideRunning: r }),
}));
