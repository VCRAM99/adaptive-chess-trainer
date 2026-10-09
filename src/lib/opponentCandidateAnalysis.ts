import type { CandidateMoveEvaluation } from "../engine/uciAnalysis";

import {
  normalizeToWhitePerspective,
  getPlayerPerspectiveEvaluation,
  type PlayerColor,
} from "./moveQuality";

import { createOpponentCandidate, type OpponentCandidate } from "./opponentMove";

function getCandidateEvaluation(
  candidate: CandidateMoveEvaluation,
  sideToMove: PlayerColor,
  opponentColor: PlayerColor,
): number {
  const whiteEvaluation = normalizeToWhitePerspective(candidate.evaluation, sideToMove);

  return getPlayerPerspectiveEvaluation(whiteEvaluation, opponentColor);
}

export function createOpponentCandidates(
  candidates: CandidateMoveEvaluation[],
  sideToMove: PlayerColor,
  opponentColor: PlayerColor,
): OpponentCandidate[] {
  if (candidates.length === 0) return [];

  const normalized = candidates.map((candidate) => ({
    candidate,
    evaluation: getCandidateEvaluation(candidate, sideToMove, opponentColor),
  }));

  const bestEvaluation = Math.max(...normalized.map((item) => item.evaluation));

  return normalized.map(({ candidate, evaluation }) =>
    createOpponentCandidate({
      rank: candidate.rank,
      move: candidate.move,
      evaluation,
      bestEvaluation,
      mate: getCandidateMate(candidate, sideToMove, opponentColor),
    }),
  );
}

function getCandidateMate(
  candidate: CandidateMoveEvaluation,
  sideToMove: PlayerColor,
  opponentColor: PlayerColor,
): number | null {
  if (candidate.evaluation.type !== "mate") return null;

  const mate = candidate.evaluation.value;

  const whiteMate = sideToMove === "white" ? mate : -mate;

  return opponentColor === "white" ? whiteMate : -whiteMate;
}
