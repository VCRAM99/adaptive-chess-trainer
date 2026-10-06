import type {
  AnalysisResult,
} from "../../engine/stockfishAnalysis";

import type {
  EngineEvaluation,
} from "../../engine/uciAnalysis";

import type {
  PlayerColor,
} from "../moveQuality";

export type MoveQualityResult = {
  centipawnLoss: number | null;
  bestMoveUci: string | null;
  qualitySource:
    | "centipawn"
    | "mate"
    | "unavailable";
};

function getSideToMove(
  fen: string
): PlayerColor {
  return fen.split(" ")[1] === "b"
    ? "black"
    : "white";
}

function toPlayerPerspective(
  evaluation: EngineEvaluation,
  fen: string,
  playedBy: PlayerColor
): EngineEvaluation {
  const sideToMove = getSideToMove(fen);

  return {
    ...evaluation,
    value:
      sideToMove === playedBy
        ? evaluation.value
        : -evaluation.value,
  };
}

function calculateMateAwareLoss(
  before: EngineEvaluation,
  after: EngineEvaluation
): number | null {
  // Both positions have ordinary evaluations.
  if (
    before.type === "cp" &&
    after.type === "cp"
  ) {
    return Math.max(
      0,
      before.value - after.value
    );
  }

  // A forced win was available before the move.
  if (
    before.type === "mate" &&
    before.value > 0
  ) {
    // The player preserved a forced win.
    // Ignore mate-distance differences for now.
    if (
      after.type === "mate" &&
      after.value > 0
    ) {
      return 0;
    }

    // The player lost the forced win.
    return 500;
  }

  // The player was facing a forced loss.
  if (
    before.type === "mate" &&
    before.value < 0
  ) {
    // Still losing by force.
    if (
      after.type === "mate" &&
      after.value < 0
    ) {
      return 0;
    }

    // Escaping the forced loss is an improvement.
    return 0;
  }

  // The move introduced a forced loss.
  if (
    after.type === "mate" &&
    after.value < 0
  ) {
    return 500;
  }

  // A non-mate position became a forced win.
  if (
    after.type === "mate" &&
    after.value > 0
  ) {
    return 0;
  }

  return null;
}

export function calculateMoveQuality(
  before: AnalysisResult,
  after: AnalysisResult,
  fenBefore: string,
  fenAfter: string,
  playedBy: PlayerColor
): MoveQualityResult {
  const bestMoveUci =
    before.bestMove || null;

  if (
    !before.evaluation ||
    !after.evaluation
  ) {
    return {
      centipawnLoss: null,
      bestMoveUci,
      qualitySource: "unavailable",
    };
  }

  const beforePlayer =
    toPlayerPerspective(
      before.evaluation,
      fenBefore,
      playedBy
    );

  const afterPlayer =
    toPlayerPerspective(
      after.evaluation,
      fenAfter,
      playedBy
    );

    const centipawnLoss = calculateMateAwareLoss(
      beforePlayer,
      afterPlayer
    );
    
    const bothCentipawn =
      beforePlayer.type === "cp" &&
      afterPlayer.type === "cp";
    
    return {
      centipawnLoss,
      bestMoveUci,
      qualitySource:
        centipawnLoss === null
          ? "unavailable"
          : bothCentipawn
            ? "centipawn"
            : "mate",
    };
}