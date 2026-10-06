import type { TrainingMode } from "../trainingDifficulty";

export type PlayerColor = "white" | "black";

export type StoredGameResult =
  | "win"
  | "loss"
  | "draw";

export type StoredMoveTiers = {
  diamond: number;
  platinum: number;
  gold: number;
  silver: number;
  bronze: number;
  steel: number;
  wood: number;
};

export type StoredGame = {
  id: string;
  playedAt: string;

  playerColor: PlayerColor;
  trainingMode: TrainingMode;

  result: StoredGameResult;

  ratingBefore: number;
  ratingAfter: number;

  // Accuracy always represents the human player's
  // side, never the adaptive opponent.
  accuracy: number | null;

  moveCount: number;

  averageCentipawnLoss: number | null;

  moveTiers: StoredMoveTiers;
};

export type PlayerProfile = {
  version: 1;

  createdAt: string;
  lastPlayedAt: string | null;

  estimatedRating: number;
  bestRating: number;

  games: StoredGame[];
};