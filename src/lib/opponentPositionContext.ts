import type { OpponentCandidate } from "./opponentMove";

export type OpponentPositionContext = "forced" | "limited" | "flexible" | "wide";

export type OpponentPositionContextResult = {
  context: OpponentPositionContext;
  candidateCount: number;
  plausibleCandidateCount: number;
  bestAlternativeLoss: number | null;
};

export const PLAUSIBLE_MOVE_CPL = 80;

export function getOpponentPositionContext(
  candidates: OpponentCandidate[],
): OpponentPositionContextResult {
  if (candidates.length === 0) {
    return {
      context: "forced",
      candidateCount: 0,
      plausibleCandidateCount: 0,
      bestAlternativeLoss: null,
    };
  }

  const sortedCandidates = [...candidates].sort((a, b) => a.centipawnLoss - b.centipawnLoss);

  const plausibleCandidates = sortedCandidates.filter(
    (candidate) => candidate.centipawnLoss <= PLAUSIBLE_MOVE_CPL,
  );

  const bestAlternativeLoss =
    sortedCandidates.length >= 2 ? sortedCandidates[1].centipawnLoss : null;

  let context: OpponentPositionContext;

  if (
    sortedCandidates.length === 1 ||
    bestAlternativeLoss === null ||
    bestAlternativeLoss > PLAUSIBLE_MOVE_CPL
  ) {
    context = "forced";
  } else if (plausibleCandidates.length <= 2) {
    context = "limited";
  } else if (plausibleCandidates.length >= 6) {
    context = "wide";
  } else {
    context = "flexible";
  }

  return {
    context,
    candidateCount: sortedCandidates.length,
    plausibleCandidateCount: plausibleCandidates.length,
    bestAlternativeLoss,
  };
}

export function getOpponentErrorScale(context: OpponentPositionContext): number {
  switch (context) {
    case "forced":
      return 0.35;

    case "limited":
      return 0.6;

    case "flexible":
      return 0.85;

    case "wide":
      return 1;
  }
}
