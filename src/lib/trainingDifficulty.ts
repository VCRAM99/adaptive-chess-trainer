export type TrainingMode = "easy" | "medium" | "hard";

const TRAINING_OFFSETS: Record<TrainingMode, number> = {
  easy: -150,
  medium: -50,
  hard: 50,
};

export const MIN_STOCKFISH_ELO = 1320;
export const MAX_STOCKFISH_ELO = 3190;

export function getTargetOpponentRating(playerRating: number, mode: TrainingMode) {
  return playerRating + TRAINING_OFFSETS[mode];
}

export const TRAINING_MODE_LABELS: Record<TrainingMode, string> = {
  easy: "Casual",
  medium: "Echo",
  hard: "Train",
};

export function getTrainingModeLabel(mode: TrainingMode): string {
  return TRAINING_MODE_LABELS[mode];
}

export function getStockfishRating(targetRating: number) {
  return Math.min(MAX_STOCKFISH_ELO, Math.max(MIN_STOCKFISH_ELO, targetRating));
}

export type OpponentConfig = {
  mode: TrainingMode;
  playerRating: number;
  targetRating: number;
  stockfishRating: number;
};

export function createOpponentConfig(playerRating: number, mode: TrainingMode): OpponentConfig {
  const targetRating = getTargetOpponentRating(playerRating, mode);

  return {
    mode,
    playerRating,
    targetRating,
    stockfishRating: getStockfishRating(targetRating),
  };
}
