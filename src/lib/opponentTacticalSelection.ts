import type { OpponentCandidate } from "./opponentMove";

export const RECOGNIZED_TACTIC_MAX_CPL = 40;

export function getRecognizedTacticalCandidates(
  candidates: OpponentCandidate[],
): OpponentCandidate[] {
  if (candidates.length === 0) return [];

  const sortedCandidates = [...candidates].sort((a, b) => a.centipawnLoss - b.centipawnLoss);

  const bestLoss = sortedCandidates[0].centipawnLoss;

  const maximumLoss = bestLoss + RECOGNIZED_TACTIC_MAX_CPL;

  const tacticalCandidates = sortedCandidates.filter(
    (candidate) => candidate.centipawnLoss <= maximumLoss,
  );

  return tacticalCandidates;
}
