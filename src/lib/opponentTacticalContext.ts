import type { OpponentCandidate } from "./opponentMove";

// import type {
//   OpponentPositionContextResult,
// } from "./opponentPositionContext";

export type OpponentTacticalContext = "normal" | "defensive" | "opportunity";

export type OpponentTacticalContextResult = {
  context: OpponentTacticalContext;
  bestEvaluation: number | null;
  bestAlternativeLoss: number | null;
  tacticalGap: number | null;
};

export const TACTICAL_GAP_CPL = 150;

export const TACTICAL_OPPORTUNITY_EVALUATION = 150;

export function getOpponentTacticalContext(
  candidates: OpponentCandidate[],
): OpponentTacticalContextResult {
  if (candidates.length < 2) {
    return {
      context: "normal",
      bestEvaluation: null,
      bestAlternativeLoss: null,
      tacticalGap: null,
    };
  }

  const sortedCandidates = [...candidates].sort((a, b) => a.centipawnLoss - b.centipawnLoss);

  const bestCandidate = sortedCandidates[0];

  const bestAlternative = sortedCandidates[1];

  const tacticalGap = bestAlternative.centipawnLoss - bestCandidate.centipawnLoss;

  if (tacticalGap < TACTICAL_GAP_CPL) {
    return {
      context: "normal",
      bestEvaluation: bestCandidate.evaluation,
      bestAlternativeLoss: bestAlternative.centipawnLoss,
      tacticalGap,
    };
  }

  const context: OpponentTacticalContext =
    bestCandidate.evaluation >= TACTICAL_OPPORTUNITY_EVALUATION ? "opportunity" : "defensive";

  return {
    context,
    bestEvaluation: bestCandidate.evaluation,
    bestAlternativeLoss: bestAlternative.centipawnLoss,
    tacticalGap,
  };
}
