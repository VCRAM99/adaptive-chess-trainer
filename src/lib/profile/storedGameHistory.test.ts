// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import { createPersistentGameId } from "../persistentGameId";
import {
  createDefaultProfile,
  loadProfile,
  saveProfile,
} from "./profileStorage";
import type { PlayerProfile, StoredMoveTiers } from "./types";
import {
  createEmptyMoveTiers,
  createUnreviewedStoredGame,
  enrichStoredGame,
  insertCompletedGame,
  isHistoryStorageReady,
  type HistoryWriteContext,
} from "./storedGameHistory";

const analyzedTiers: StoredMoveTiers = {
  diamond: 1,
  platinum: 0,
  gold: 2,
  silver: 0,
  bronze: 0,
  steel: 0,
  wood: 1,
};

function finishedGame(id = createPersistentGameId()) {
  return createUnreviewedStoredGame({
    id,
    playedAt: "2026-10-08T17:00:00.000Z",
    playerColor: "white",
    trainingMode: "medium",
    result: "win",
    ratingBefore: 700,
    ratingAfter: 724,
    moveCount: 12,
  });
}

function context(
  overrides: Partial<HistoryWriteContext> = {}
): HistoryWriteContext {
  return {
    discardedIds: new Set(),
    gameOwnerId: "player-a",
    currentOwnerId: "player-a",
    activeReviewGameId: null,
    ...overrides,
  };
}

function saveFinishedGame(
  profile: PlayerProfile = createDefaultProfile(),
  game = finishedGame()
) {
  return {
    game,
    profile: insertCompletedGame(profile, game, context()),
  };
}

describe("completed game history", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves a completed game before review finishes", () => {
    const { game, profile } = saveFinishedGame();

    expect(profile.games).toEqual([game]);
    expect(game.accuracy).toBeNull();
    expect(game.averageCentipawnLoss).toBeNull();
    expect(game.moveTiers).toEqual(createEmptyMoveTiers());
    expect(profile.estimatedRating).toBe(724);
    expect(profile.bestRating).toBe(724);
  });

  it("keeps the saved game when review fails", () => {
    const { game, profile } = saveFinishedGame();

    const afterFailedReview = enrichStoredGame(
      profile,
      game.id,
      {
        accuracy: 90,
        averageCentipawnLoss: 20,
        moveTiers: analyzedTiers,
      },
      context({ activeReviewGameId: null })
    );

    expect(afterFailedReview).toBe(profile);
    expect(afterFailedReview.games[0].accuracy).toBeNull();
  });

  it("keeps the saved game when a new game starts", () => {
    const { game, profile } = saveFinishedGame();

    const afterNewGame = enrichStoredGame(
      profile,
      game.id,
      {
        accuracy: 90,
        averageCentipawnLoss: 20,
        moveTiers: analyzedTiers,
      },
      context({ activeReviewGameId: null })
    );

    expect(afterNewGame.games.map((stored) => stored.id)).toEqual([
      game.id,
    ]);
  });

  it("enriches the same game instead of adding a row", () => {
    const { game, profile } = saveFinishedGame();

    const enriched = enrichStoredGame(
      profile,
      game.id,
      {
        accuracy: 88.5,
        averageCentipawnLoss: 31,
        moveTiers: analyzedTiers,
      },
      context({ activeReviewGameId: game.id })
    );

    expect(enriched.games).toHaveLength(1);
    expect(enriched.games[0].id).toBe(game.id);
    expect(enriched.games[0].accuracy).toBe(88.5);
    expect(enriched.games[0].averageCentipawnLoss).toBe(31);
    expect(enriched.games[0].moveTiers).toEqual(analyzedTiers);
    expect(enriched.games[0].result).toBe(game.result);
    expect(enriched.games[0].moveCount).toBe(game.moveCount);
    expect(enriched.games[0].ratingBefore).toBe(700);
    expect(enriched.games[0].ratingAfter).toBe(724);
  });

  it("does not change Elo or best rating during enrichment", () => {
    const started = {
      ...createDefaultProfile(),
      estimatedRating: 724,
      bestRating: 740,
    };
    const game = finishedGame();
    const saved = insertCompletedGame(started, game, context());

    const enriched = enrichStoredGame(
      saved,
      game.id,
      {
        accuracy: 70,
        averageCentipawnLoss: 40,
        moveTiers: analyzedTiers,
      },
      context({ activeReviewGameId: game.id })
    );

    expect(enriched.estimatedRating).toBe(saved.estimatedRating);
    expect(enriched.bestRating).toBe(saved.bestRating);
    expect(enriched.lastPlayedAt).toBe(saved.lastPlayedAt);
  });

  it("does not duplicate history when completion is recorded twice", () => {
    const game = finishedGame();
    const once = insertCompletedGame(
      createDefaultProfile(),
      game,
      context()
    );
    const twice = insertCompletedGame(once, game, context());

    expect(twice).toBe(once);
    expect(twice.games).toHaveLength(1);
    expect(twice.estimatedRating).toBe(724);
  });

  it("does not let a late review restore a reset profile", () => {
    const { game } = saveFinishedGame();
    const resetProfile = createDefaultProfile();
    const discardedIds = new Set([game.id]);

    const lateInsert = insertCompletedGame(
      resetProfile,
      game,
      context({ discardedIds })
    );
    const lateReview = enrichStoredGame(
      resetProfile,
      game.id,
      {
        accuracy: 99,
        averageCentipawnLoss: 1,
        moveTiers: analyzedTiers,
      },
      context({
        discardedIds,
        activeReviewGameId: game.id,
      })
    );

    expect(lateInsert).toBe(resetProfile);
    expect(lateReview).toBe(resetProfile);
    expect(resetProfile.games).toEqual([]);
  });

  it("rejects review writes from another game or account", () => {
    const { game, profile } = saveFinishedGame();
    const analysis = {
      accuracy: 10,
      averageCentipawnLoss: 80,
      moveTiers: analyzedTiers,
    };

    const otherGame = enrichStoredGame(
      profile,
      game.id,
      analysis,
      context({ activeReviewGameId: createPersistentGameId() })
    );
    const otherAccount = enrichStoredGame(
      profile,
      game.id,
      analysis,
      context({
        activeReviewGameId: game.id,
        gameOwnerId: "player-a",
        currentOwnerId: "player-b",
      })
    );
    const otherAccountInsert = insertCompletedGame(
      profile,
      finishedGame(),
      context({
        gameOwnerId: "player-a",
        currentOwnerId: "player-b",
      })
    );

    expect(otherGame).toBe(profile);
    expect(otherAccount).toBe(profile);
    expect(otherAccountInsert).toBe(profile);
    expect(profile.games).toHaveLength(1);
    expect(profile.games[0].accuracy).toBeNull();
  });

  it("keeps legacy game ids readable", () => {
    const legacy = finishedGame("game-1");
    const saved = insertCompletedGame(
      createDefaultProfile(),
      legacy,
      context({ gameOwnerId: null, currentOwnerId: null })
    );

    saveProfile(saved);

    const loaded = loadProfile();

    expect(loaded.games.map((game) => game.id)).toEqual(["game-1"]);

    const enriched = enrichStoredGame(
      loaded,
      "game-1",
      {
        accuracy: 81,
        averageCentipawnLoss: 22,
        moveTiers: analyzedTiers,
      },
      context({
        gameOwnerId: null,
        currentOwnerId: null,
        activeReviewGameId: "game-1",
      })
    );

    expect(enriched.games[0].id).toBe("game-1");
    expect(enriched.games[0].accuracy).toBe(81);
  });

  it("preserves history order when an older game is enriched", () => {
    const first = finishedGame();
    const second = createUnreviewedStoredGame({
      ...finishedGame(),
      id: createPersistentGameId(),
      playedAt: "2026-10-08T18:00:00.000Z",
    });
    const saved = insertCompletedGame(
      insertCompletedGame(createDefaultProfile(), first, context()),
      second,
      context()
    );

    const enriched = enrichStoredGame(
      saved,
      first.id,
      {
        accuracy: 77,
        averageCentipawnLoss: 18,
        moveTiers: analyzedTiers,
      },
      context({ activeReviewGameId: first.id })
    );

    expect(enriched.games.map((game) => game.id)).toEqual([
      first.id,
      second.id,
    ]);
    expect(enriched.games[1]).toBe(saved.games[1]);
  });

  it("writes only for the loaded guest or account", () => {
    expect(
      isHistoryStorageReady({
        isAuthLoading: false,
        storageStatus: "guest",
        loadedStorageUserId: null,
        currentUserId: null,
      })
    ).toBe(true);

    expect(
      isHistoryStorageReady({
        isAuthLoading: false,
        storageStatus: "account",
        loadedStorageUserId: "player-a",
        currentUserId: "player-b",
      })
    ).toBe(false);

    expect(
      isHistoryStorageReady({
        isAuthLoading: false,
        storageStatus: "loading",
        loadedStorageUserId: null,
        currentUserId: null,
      })
    ).toBe(false);
  });
});
