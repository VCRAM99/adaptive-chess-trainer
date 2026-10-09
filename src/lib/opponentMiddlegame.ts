import { getFullMoveNumberFromFen, isOpponentOpeningPhase } from "./opponentOpening";

import { isOpponentEndgame } from "./opponentEndgame";

export const MIDDLEGAME_CPL_MULTIPLIER = 1.15;

export function isOpponentMiddlegame(fen: string): boolean {
  const fullMoveNumber = getFullMoveNumberFromFen(fen);

  return !isOpponentOpeningPhase(fullMoveNumber) && !isOpponentEndgame(fen);
}

export function adjustMiddlegameDesiredCpl(desiredCpl: number): number {
  return Math.max(0, desiredCpl * MIDDLEGAME_CPL_MULTIPLIER);
}
