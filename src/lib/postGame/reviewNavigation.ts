import type { CompletedGameRecord } from "./types";

export function clampReviewPly(ply: number, totalMoves: number): number {
  if (!Number.isFinite(ply)) return 0;

  return Math.max(0, Math.min(Math.trunc(ply), totalMoves));
}

export function getReviewFen(game: CompletedGameRecord, selectedPly: number): string | null {
  if (game.moves.length === 0) return null;

  const ply = clampReviewPly(selectedPly, game.moves.length);

  if (ply === 0) return game.moves[0].fenBefore;

  return game.moves[ply - 1].fenAfter;
}

export function getNextReviewPly(selectedPly: number, totalMoves: number): number {
  return clampReviewPly(selectedPly + 1, totalMoves);
}

export function getPreviousReviewPly(selectedPly: number, totalMoves: number): number {
  return clampReviewPly(selectedPly - 1, totalMoves);
}
