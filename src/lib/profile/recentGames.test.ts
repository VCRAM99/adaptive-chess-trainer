import { describe, expect, it } from "vitest";

import type { StoredGame } from "./types";

import { getRecentGames } from "./recentGames";

function createGame(overrides: Partial<StoredGame> = {}): StoredGame {
  return {
    id: "game",
    playedAt: "2026-10-06T12:00:00.000Z",

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

describe("getRecentGames", () => {
  it("sorts games newest first", () => {
    const games = [
      createGame({
        id: "old",
        playedAt: "2026-10-01T12:00:00.000Z",
      }),

      createGame({
        id: "new",
        playedAt: "2026-10-06T12:00:00.000Z",
      }),

      createGame({
        id: "middle",
        playedAt: "2026-10-04T12:00:00.000Z",
      }),
    ];

    const result = getRecentGames(games, {
      easy: true,
      medium: true,
      hard: true,
    });

    expect(result.map((game) => game.id)).toEqual(["new", "middle", "old"]);
  });

  it("uses the selected difficulty filter", () => {
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

    const result = getRecentGames(games, {
      easy: false,
      medium: true,
      hard: true,
    });

    expect(result.map((game) => game.id)).toEqual(["medium", "hard"]);
  });

  it("does not mutate the original games array", () => {
    const games = [
      createGame({
        id: "old",
        playedAt: "2026-10-01T12:00:00.000Z",
      }),

      createGame({
        id: "new",
        playedAt: "2026-10-06T12:00:00.000Z",
      }),
    ];

    getRecentGames(games, {
      easy: true,
      medium: true,
      hard: true,
    });

    expect(games.map((game) => game.id)).toEqual(["old", "new"]);
  });
});
