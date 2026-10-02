export const DISPLAY_RATING_OFFSET = 100;

export function getDisplayedRating(
  internalRating: number
): number {
  return Math.max(
    0,
    Math.round(internalRating + DISPLAY_RATING_OFFSET)
  );
}