import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { useGame, Piece, MoldId, DecorationId } from "../game/store";
import { CastlePiece } from "./CastlePiece";
import { Decoration } from "./Decoration";
import { waterYFromTide } from "./Ocean";

/** Render all placed pieces. Each piece subscribes to tide for wetness. */
export function PlacedPieces() {
  const pieces = useGame((s) => s.pieces);
  const tool = useGame((s) => s.tool);
  const removePiece = useGame((s) => s.removePiece);

  return (
    <group>
      {pieces.map((p) => (
        <PieceMesh
          key={p.id}
          piece={p}
          erasing={tool === "erase"}
          onErase={() => removePiece(p.id)}
        />
      ))}
    </group>
  );
}

function PieceMesh({
  piece,
  erasing,
  onErase,
}: {
  piece: Piece;
  erasing: boolean;
  onErase: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);

  useFrame(() => {
    const tide = useGame.getState().tide;
    const waterY = waterYFromTide(tide);
    // Wetness ramps as the water reaches the piece base
    const wet = THREE.MathUtils.clamp(
      (waterY - piece.baseY + 0.05) / 0.3,
      0,
      1
    );
    // Submerge & melt: when water rises above half the piece's height, sink it slightly
    const submerge = Math.max(0, waterY - (piece.baseY + piece.height * 0.55));
    // gentle sink that knocks it down eventually
    const sink = Math.min(piece.height * 0.9, submerge * 1.5);
    if (group.current) {
      group.current.position.y = piece.baseY - sink;
      // small wobble as it gets soggy
      const wobble = wet * 0.04;
      group.current.rotation.x = Math.sin(performance.now() * 0.0015 + piece.seed) * wobble;
      group.current.rotation.z = Math.cos(performance.now() * 0.0017 + piece.seed) * wobble;
      // store wetness for child material swap
      (group.current.userData as any).wet = wet;

      // visual erase hint
      const scale = erasing && hover ? 1.04 : 1;
      group.current.scale.setScalar(scale);
    }
  });

  return (
    <group
      ref={group}
      position={piece.position}
      rotation={[0, piece.rotationY, 0]}
      onPointerOver={(e) => {
        if (!erasing) return;
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "";
      }}
      onPointerDown={(e) => {
        if (!erasing) return;
        e.stopPropagation();
        onErase();
      }}
    >
      {piece.kind === "mold" ? (
        <CastlePiece variant={piece.variant as MoldId} />
      ) : (
        <Decoration variant={piece.variant as DecorationId} seed={piece.seed} />
      )}
    </group>
  );
}
