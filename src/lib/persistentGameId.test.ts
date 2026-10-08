// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import { createStoredGame } from "./profile/createStoredGame";
import {
  addStoredGame,
  createDefaultProfile,
  loadProfile,
  saveProfile,
} from "./profile/profileStorage";
import type { StoredGame } from "./profile/types";
import { buildGameRecord } from "./postGame/buildGameRecord";
import { createPersistentGameId } from "./persistentGameId";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createHistoryGame(id: string, playedAt = "2026-10-08T16:00:00.000Z"): StoredGame {
  return createStoredGame({
    id,
    playedAt,
    playerColor: "white",
    trainingMode: "medium",
    result: "win",
    ratingBefore: 700,
    ratingAfter: 720,
    accuracy: 80,
    averageCentipawnLoss: 30,
    moveCount: 4,
    moveTiers: {
      diamond: 0,
      platinum: 0,
      gold: 1,
      silver: 1,
      bronze: 0,
      steel: 0,
      wood: 0,
    },
  });
}

describe("createPersistentGameId", () => {
  it("gives two simulated sessions different ids", () => {
    const firstSession = createPersistentGameId();
    const secondSession = createPersistentGameId();

    expect(firstSession).toMatch(UUID_PATTERN);
    expect(secondSession).toMatch(UUID_PATTERN);
    expect(firstSession).not.toBe(secondSession);
  });

  it("keeps the same id through completion and review storage", () => {
    const persistentId = createPersistentGameId();

    const completed = buildGameRecord(
      "1. e4 e5 2. Nf3 Nc6",
      persistentId,
      "2026-10-08T16:00:00.000Z",
      "2026-10-08T16:05:00.000Z",
      "draw",
    );

    const reviewed = createHistoryGame(completed.id);

    expect(completed.id).toBe(persistentId);
    expect(reviewed.id).toBe(persistentId);
  });
});

describe("stored game ids", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps legacy game ids readable", () => {
    const profile = addStoredGame(
      addStoredGame(
        createDefaultProfile(),
        createHistoryGame("game-1", "2026-10-01T12:00:00.000Z"),
      ),
      createHistoryGame("game-2", "2026-10-02T12:00:00.000Z"),
    );

    saveProfile(profile);

    expect(loadProfile().games.map((game) => game.id)).toEqual(["game-1", "game-2"]);
  });

  it("retains distinct games from separate sessions", () => {
    const firstGame = createHistoryGame(createPersistentGameId(), "2026-10-08T16:00:00.000Z");
    const secondGame = createHistoryGame(createPersistentGameId(), "2026-10-08T17:00:00.000Z");

    const profile = addStoredGame(addStoredGame(createDefaultProfile(), firstGame), secondGame);

    expect(profile.games.map((game) => game.id)).toEqual([firstGame.id, secondGame.id]);
  });

  it("still rejects a second save of the same game", () => {
    const game = createHistoryGame(createPersistentGameId());
    const saved = addStoredGame(createDefaultProfile(), game);
    const duplicate = addStoredGame(saved, game);

    expect(duplicate).toBe(saved);
    expect(duplicate.games).toHaveLength(1);
  });

  it("still rejects a duplicate legacy id", () => {
    const game = createHistoryGame("game-1");
    const saved = addStoredGame(createDefaultProfile(), game);

    expect(addStoredGame(saved, game).games).toHaveLength(1);
  });
});
