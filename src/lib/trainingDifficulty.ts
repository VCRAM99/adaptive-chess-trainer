export type TrainingMode = "easy" | "medium" | "hard";

const TRAINING_OFFSETS: Record<TrainingMode, number> = {
  easy: -75,
  medium: 0,
  hard: 75,
};

export const MIN_STOCKFISH_ELO = 1320;
export const MAX_STOCKFISH_ELO = 3190;

export function getTargetOpponentRating(
  playerRating: number,
  mode: TrainingMode
) {
  return playerRating + TRAINING_OFFSETS[mode];
}

export function getStockfishRating(
  targetRating: number
) {
  return Math.min(
    MAX_STOCKFISH_ELO,
    Math.max(MIN_STOCKFISH_ELO, targetRating)
  );
}