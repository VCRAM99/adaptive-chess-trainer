import type { TrainingMode } from "../trainingDifficulty";
import { addStoredGame } from "./profileStorage";
import { createStoredGame } from "./createStoredGame";
import type {
  PlayerColor,
  PlayerProfile,
  StoredGame,
  StoredGameResult,
  StoredMoveTiers,
} from "./types";

export type StoredGameAnalysis = {
  accuracy: number | null;
  averageCentipawnLoss: number | null;
  moveTiers: StoredMoveTiers;
};

export type HistoryWriteContext = {
  discardedIds: ReadonlySet<string>;
  gameOwnerId: string | null;
  currentOwnerId: string | null;
  activeReviewGameId: string | null;
};

export function createEmptyMoveTiers(): StoredMoveTiers {
  return {
    diamond: 0,
    platinum: 0,
    gold: 0,
    silver: 0,
    bronze: 0,
    steel: 0,
    wood: 0,
  };
}

export function createUnreviewedStoredGame(input: {
  id: string;
  playedAt: string;
  playerColor: PlayerColor;
  trainingMode: TrainingMode;
  result: StoredGameResult;
  ratingBefore: number;
  ratingAfter: number;
  moveCount: number;
}): StoredGame {
  return createStoredGame({
    ...input,
    accuracy: null,
    averageCentipawnLoss: null,
    moveTiers: createEmptyMoveTiers(),
  });
}

export function isHistoryStorageReady(input: {
  isAuthLoading: boolean;
  storageStatus: "loading" | "guest" | "account" | "error";
  loadedStorageUserId: string | null | undefined;
  currentUserId: string | null;
}): boolean {
  if (input.isAuthLoading) {
    return false;
  }

  if (
    input.storageStatus !== "guest" &&
    input.storageStatus !== "account"
  ) {
    return false;
  }

  return input.loadedStorageUserId === input.currentUserId;
}

function ownsThisHistory(
  context: HistoryWriteContext
): boolean {
  return context.gameOwnerId === context.currentOwnerId;
}

/**
 * Inserts a finished game once.
 *
 * A discarded id, or a write from another owner, leaves the profile untouched.
 * addStoredGame applies the rating snapshot only on the first insert.
 */
export function insertCompletedGame(
  profile: PlayerProfile,
  game: StoredGame,
  context: HistoryWriteContext
): PlayerProfile {
  if (!ownsThisHistory(context)) {
    return profile;
  }

  if (context.discardedIds.has(game.id)) {
    return profile;
  }

  return addStoredGame(profile, game);
}

function sameTiers(
  left: StoredMoveTiers,
  right: StoredMoveTiers
): boolean {
  return (
    left.diamond === right.diamond &&
    left.platinum === right.platinum &&
    left.gold === right.gold &&
    left.silver === right.silver &&
    left.bronze === right.bronze &&
    left.steel === right.steel &&
    left.wood === right.wood
  );
}

/**
 * Fills analysis fields on the saved game with this id.
 *
 * Missing, discarded, or unrelated games are not created or changed.
 * Rating fields and history order stay as they were.
 */
export function enrichStoredGame(
  profile: PlayerProfile,
  gameId: string,
  analysis: StoredGameAnalysis,
  context: HistoryWriteContext
): PlayerProfile {
  if (!ownsThisHistory(context)) {
    return profile;
  }

  if (context.activeReviewGameId !== gameId) {
    return profile;
  }

  if (context.discardedIds.has(gameId)) {
    return profile;
  }

  const index = profile.games.findIndex(
    (game) => game.id === gameId
  );

  if (index === -1) {
    return profile;
  }

  const current = profile.games[index];

  if (
    current.accuracy === analysis.accuracy &&
    current.averageCentipawnLoss ===
      analysis.averageCentipawnLoss &&
    sameTiers(current.moveTiers, analysis.moveTiers)
  ) {
    return profile;
  }

  const games = profile.games.slice();

  games[index] = {
    ...current,
    accuracy: analysis.accuracy,
    averageCentipawnLoss: analysis.averageCentipawnLoss,
    moveTiers: { ...analysis.moveTiers },
  };

  return {
    ...profile,
    games,
  };
}
