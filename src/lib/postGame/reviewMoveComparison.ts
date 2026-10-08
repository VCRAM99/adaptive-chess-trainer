export type ReviewMoveComparison = "best" | "different" | "unavailable";

export function compareReviewMove(
  playedMoveUci: string,
  bestMoveUci: string | null,
): ReviewMoveComparison {
  if (!bestMoveUci) return "unavailable";

  const played = playedMoveUci.trim().toLowerCase();

  const best = bestMoveUci.trim().toLowerCase();

  if (!played || !best) return "unavailable";

  return played === best ? "best" : "different";
}
