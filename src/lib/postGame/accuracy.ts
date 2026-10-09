import type { AnalyzedMove, MoveTier } from "./types";

export const MOVE_TIER_ACCURACY: Record<MoveTier, number> = {
  diamond: 100,
  platinum: 90,
  gold: 80,
  silver: 65,
  bronze: 45,
  steel: 30,
  wood: 10,
};

export function getMoveAccuracy(tier: MoveTier): number {
  return MOVE_TIER_ACCURACY[tier];
}

export function calculatePlayerAccuracy(
  moves: AnalyzedMove[],
  playerColor: "white" | "black",
): number | null {
  const gradableMoves = moves.filter(
    (move) => move.playedBy === playerColor && move.tier !== null && !move.isForcedMove,
  );

  if (gradableMoves.length === 0) return null;

  const total = gradableMoves.reduce(
    (sum, move) => sum + MOVE_TIER_ACCURACY[move.tier as MoveTier],
    0,
  );

  return total / gradableMoves.length;
}
