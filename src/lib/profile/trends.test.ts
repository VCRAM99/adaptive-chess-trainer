import { describe, expect, it } from "vitest";

import type { StoredGame } from "./types";

import { getAccuracyTrend, getCplTrend, getRatingTrend } from "./trends";

function createGame(overrides: Partial<StoredGame> = {}): StoredGame {
  return {
    id: "game",

    playedAt: "2026-10-01T12:00:00.000Z",

    playerColor: "white",
    trainingMode: "medium",

    result: "win",

    ratingBefore: 700,
    ratingAfter: 710,

    accuracy: 80,
    averageCentipawnLoss: 50,

    moveCount: 20,

    moveTiers: {
      diamond: 1,
      platinum: 2,
      gold: 3,
      silver: 4,
      bronze: 2,
      steel: 1,
      wood: 0,
    },

    ...overrides,
  };
}

const allDifficulties = {
  easy: true,
  medium: true,
  hard: true,
};

describe("profile trends", () => {
  it("sorts rating history oldest first", () => {
    const games = [
      createGame({
        id: "game-3",
        playedAt: "2026-10-03T12:00:00.000Z",
        ratingAfter: 740,
      }),

      createGame({
        id: "game-1",
        playedAt: "2026-10-01T12:00:00.000Z",
        ratingAfter: 710,
      }),

      createGame({
        id: "game-2",
        playedAt: "2026-10-02T12:00:00.000Z",
        ratingAfter: 725,
      }),
    ];

    const result = getRatingTrend(games);

    expect(result.map((point) => point.gameId)).toEqual(["game-1", "game-2", "game-3"]);
  });

  it("uses displayed rating for rating history", () => {
    const games = [
      createGame({
        ratingAfter: 700,
      }),
    ];

    const result = getRatingTrend(games);

    expect(result[0].value).toBe(800);
  });

  it("rating history ignores difficulty filtering", () => {
    const games = [
      createGame({
        id: "easy",
        trainingMode: "easy",
      }),

      createGame({
        id: "medium",
        trainingMode: "medium",
      }),

      createGame({
        id: "hard",
        trainingMode: "hard",
      }),
    ];

    const result = getRatingTrend(games);

    expect(result.map((point) => point.gameId)).toEqual(["easy", "medium", "hard"]);
  });

  it("filters accuracy by difficulty", () => {
    const games = [
      createGame({
        id: "easy",
        trainingMode: "easy",
        accuracy: 90,
      }),

      createGame({
        id: "medium",
        trainingMode: "medium",
        accuracy: 80,
      }),

      createGame({
        id: "hard",
        trainingMode: "hard",
        accuracy: 70,
      }),
    ];

    const result = getAccuracyTrend(games, {
      easy: false,
      medium: true,
      hard: true,
    });

    expect(result.map((point) => point.gameId)).toEqual(["medium", "hard"]);
  });

  it("skips games without accuracy", () => {
    const games = [
      createGame({
        id: "missing",
        accuracy: null,
      }),

      createGame({
        id: "valid",
        accuracy: 82.5,
        playedAt: "2026-10-02T12:00:00.000Z",
      }),
    ];

    const result = getAccuracyTrend(games, allDifficulties);

    expect(result).toHaveLength(1);
    expect(result[0].gameId).toBe("valid");
    expect(result[0].value).toBe(82.5);
  });

  it("filters CPL by difficulty", () => {
    const games = [
      createGame({
        id: "easy",
        trainingMode: "easy",
        averageCentipawnLoss: 30,
      }),

      createGame({
        id: "medium",
        trainingMode: "medium",
        averageCentipawnLoss: 45,
      }),

      createGame({
        id: "hard",
        trainingMode: "hard",
        averageCentipawnLoss: 60,
      }),
    ];

    const result = getCplTrend(games, {
      easy: true,
      medium: false,
      hard: true,
    });

    expect(result.map((point) => point.gameId)).toEqual(["easy", "hard"]);
  });

  it("skips games without CPL", () => {
    const games = [
      createGame({
        id: "missing",
        averageCentipawnLoss: null,
      }),

      createGame({
        id: "valid",
        averageCentipawnLoss: 41.5,
        playedAt: "2026-10-02T12:00:00.000Z",
      }),
    ];

    const result = getCplTrend(games, allDifficulties);

    expect(result).toHaveLength(1);
    expect(result[0].gameId).toBe("valid");
    expect(result[0].value).toBe(41.5);
  });

  it("does not mutate the original games array", () => {
    const games = [
      createGame({
        id: "new",
        playedAt: "2026-10-03T12:00:00.000Z",
      }),

      createGame({
        id: "old",
        playedAt: "2026-10-01T12:00:00.000Z",
      }),
    ];

    getRatingTrend(games);

    expect(games.map((game) => game.id)).toEqual(["new", "old"]);
  });
});
