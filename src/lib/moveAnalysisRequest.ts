import type { PlayerColor } from "./moveQuality";
import type { MoveAnalysis } from "./moveAnalysis";
import { updateSkillFromAnalysis } from "./skillEstimator";

export type MoveAnalysisDelivery = {
  requestId: string;
  gameGeneration: number;
  beforeFen: string;
  afterFen: string;
  analysis: MoveAnalysis;
};

export type ExpectedMoveAnalysis = {
  requestId: string;
  gameGeneration: number;
  beforeFen: string;
  afterFen: string;
  playerColor: PlayerColor;
};

export function createMoveAnalysisRequestId(
  gameGeneration: number,
  sequence: number
): string {
  return `${gameGeneration}:${sequence}`;
}

export function shouldApplyMoveAnalysis(
  delivered: MoveAnalysisDelivery,
  expected: ExpectedMoveAnalysis | null,
  pendingOpponentFen: string | null
): boolean {
  if (!expected || pendingOpponentFen === null) {
    return false;
  }

  return (
    delivered.requestId === expected.requestId &&
    delivered.gameGeneration === expected.gameGeneration &&
    delivered.beforeFen === expected.beforeFen &&
    delivered.afterFen === expected.afterFen &&
    delivered.afterFen === pendingOpponentFen &&
    delivered.analysis.playerColor === expected.playerColor
  );
}

export type MoveAnalysisUpdate = {
  accepted: boolean;
  estimatedRating: number;
  opponentTargetSkill: number | null;
  lastRatedRequestId: string | null;
  acceptedAnalysis: MoveAnalysis | null;
};

/**
 * Applies a finished player-move analysis only when it is
 * still the request the current game is waiting for.
 * Rejected results leave rating, quality, and opponent skill unchanged.
 */
export function resolveMoveAnalysisUpdate(input: {
  delivered: MoveAnalysisDelivery | null;
  expected: ExpectedMoveAnalysis | null;
  pendingOpponentFen: string | null;
  estimatedRating: number;
  lastRatedRequestId: string | null;
  opponentTargetSkill: number | null;
}): MoveAnalysisUpdate {
  const unchanged: MoveAnalysisUpdate = {
    accepted: false,
    estimatedRating: input.estimatedRating,
    opponentTargetSkill: input.opponentTargetSkill,
    lastRatedRequestId: input.lastRatedRequestId,
    acceptedAnalysis: null,
  };

  if (
    !input.delivered ||
    !shouldApplyMoveAnalysis(
      input.delivered,
      input.expected,
      input.pendingOpponentFen
    )
  ) {
    return unchanged;
  }

  const alreadyRated =
    input.lastRatedRequestId === input.delivered.requestId;

  const nextRating = alreadyRated
    ? input.estimatedRating
    : updateSkillFromAnalysis(
        input.estimatedRating,
        input.delivered.analysis
      );

  return {
    accepted: true,
    estimatedRating: nextRating,
    opponentTargetSkill: nextRating,
    lastRatedRequestId: input.delivered.requestId,
    acceptedAnalysis: input.delivered.analysis,
  };
}
