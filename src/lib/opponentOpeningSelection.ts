import type { OpponentCandidate } from "./opponentMove";

import { getOpeningMoveCharacteristics } from "./opponentOpeningMove";

import { getOpeningPreferenceAdjustment } from "./opponentOpeningPreference";

export type OpeningCandidateSelection = {
  candidate: OpponentCandidate;
  baseDistance: number;
  openingAdjustment: number;
  selectionDistance: number;
};

export function createOpeningCandidateSelections(
  candidates: OpponentCandidate[],
  desiredCpl: number,
  fen: string,
  targetSkill: number,
): OpeningCandidateSelection[] {
  return candidates.map((candidate) => {
    const characteristics = getOpeningMoveCharacteristics(fen, candidate.move);

    const openingAdjustment = getOpeningPreferenceAdjustment(characteristics, targetSkill);

    const baseDistance = Math.abs(candidate.centipawnLoss - desiredCpl);

    const selectionDistance = Math.max(0, baseDistance + openingAdjustment);

    return {
      candidate,
      baseDistance,
      openingAdjustment,
      selectionDistance,
    };
  });
}

export function chooseOpeningAwareCandidate(
  candidates: OpponentCandidate[],
  desiredCpl: number,
  fen: string,
  targetSkill: number,
): OpponentCandidate | null {
  const selections = createOpeningCandidateSelections(candidates, desiredCpl, fen, targetSkill);

  if (selections.length === 0) return null;

  let bestSelection = selections[0];

  for (let index = 1; index < selections.length; index += 1) {
    if (selections[index].selectionDistance < bestSelection.selectionDistance) {
      bestSelection = selections[index];
    }
  }

  return bestSelection.candidate;
}
