export type OpponentGamePhase = "opening" | "post-opening";

export const OPENING_MAX_FULL_MOVE = 10;

export function getOpponentGamePhase(fullMoveNumber: number): OpponentGamePhase {
  const normalizedMoveNumber = Math.max(1, Math.floor(fullMoveNumber));

  return normalizedMoveNumber <= OPENING_MAX_FULL_MOVE ? "opening" : "post-opening";
}

export function isOpponentOpeningPhase(fullMoveNumber: number): boolean {
  return getOpponentGamePhase(fullMoveNumber) === "opening";
}

export function getFullMoveNumberFromFen(fen: string): number {
  const parts = fen.trim().split(/\s+/);

  const parsed = Number(parts[5]);

  if (!Number.isFinite(parsed) || parsed < 1) return 1;

  return Math.floor(parsed);
}
