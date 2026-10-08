import type { AnalyzedMove, MoveTier } from "./types";

import { calculatePlayerAccuracy, MOVE_TIER_ACCURACY } from "./accuracy";

export type TierCounts = Record<MoveTier, number>;

export type GameSummary = {
  accuracy: number | null;
  averageCentipawnLoss: number | null;

  tierCounts: TierCounts;

  totalPlayerMoves: number;
  gradableMoves: number;
  forcedMoves: number;

  bestMove: AnalyzedMove | null;
  biggestMistake: AnalyzedMove | null;
};

function createEmptyTierCounts(): TierCounts {
  return {
    diamond: 0,
    platinum: 0,
    gold: 0,
    silver: 0,
    bronze: 0,
    steel: 0,
    wood: 0,
  };
}

export function calculateGameSummary(
  moves: AnalyzedMove[],
  playerColor: "white" | "black",
): GameSummary {
  const playerMoves = moves.filter((move) => move.playedBy === playerColor);

  const gradableMoves = playerMoves.filter((move) => move.tier !== null && !move.isForcedMove);

  const tierCounts = createEmptyTierCounts();

  for (const move of gradableMoves) {
    if (move.tier) {
      tierCounts[move.tier] += 1;
    }
  }

  const cpMoves = gradableMoves.filter(
    (move) => move.qualitySource === "centipawn" && move.centipawnLoss !== null,
  );

  const averageCentipawnLoss =
    cpMoves.length === 0
      ? null
      : cpMoves.reduce((sum, move) => sum + (move.centipawnLoss ?? 0), 0) / cpMoves.length;

  const bestMove =
    gradableMoves.length === 0
      ? null
      : gradableMoves.reduce((best, move) => {
          if (best.tier === null) return move;

          if (move.tier === null) return best;

          const moveScore = MOVE_TIER_ACCURACY[move.tier];

          const bestScore = MOVE_TIER_ACCURACY[best.tier];

          if (moveScore > bestScore) return move;

          if (
            moveScore === bestScore &&
            move.centipawnLoss !== null &&
            best.centipawnLoss !== null &&
            move.centipawnLoss < best.centipawnLoss
          ) {
            return move;
          }

          return best;
        });

  const biggestMistake =
    gradableMoves.length === 0
      ? null
      : gradableMoves.reduce((worst, move) => {
          const moveLoss = move.centipawnLoss ?? -1;

          const worstLoss = worst.centipawnLoss ?? -1;

          return moveLoss > worstLoss ? move : worst;
        });

  return {
    accuracy: calculatePlayerAccuracy(moves, playerColor),

    averageCentipawnLoss,

    tierCounts,

    totalPlayerMoves: playerMoves.length,
    gradableMoves: gradableMoves.length,

    forcedMoves: playerMoves.filter((move) => move.isForcedMove).length,

    bestMove,

    biggestMistake,
  };
}
