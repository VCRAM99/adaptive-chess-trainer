import { describe, expect, it } from "vitest";

import { createStoredGame, getStoredGameResult } from "./createStoredGame";

describe("createStoredGame", () => {
  it("creates a stored game", () => {
    const game = createStoredGame({
      id: "game-1",
      playedAt: "2026-10-05T12:00:00.000Z",

      playerColor: "black",
      trainingMode: "hard",

      result: "win",

      ratingBefore: 800,
      ratingAfter: 820,

      accuracy: 88.4,
      averageCentipawnLoss: 37,

      moveCount: 34,

      moveTiers: {
        diamond: 2,
        platinum: 4,
        gold: 7,
        silver: 5,
        bronze: 2,
        steel: 1,
        wood: 0,
      },
    });

    expect(game.playerColor).toBe("black");

    expect(game.accuracy).toBe(88.4);

    expect(game.ratingBefore).toBe(800);
    expect(game.ratingAfter).toBe(820);
  });
});

describe("getStoredGameResult", () => {
  it("returns win when White player wins", () => {
    expect(getStoredGameResult("white", "white")).toBe("win");
  });

  it("returns loss when White player loses", () => {
    expect(getStoredGameResult("black", "white")).toBe("loss");
  });

  it("returns win when Black player wins", () => {
    expect(getStoredGameResult("black", "black")).toBe("win");
  });

  it("returns loss when Black player loses", () => {
    expect(getStoredGameResult("white", "black")).toBe("loss");
  });

  it("returns draw regardless of player color", () => {
    expect(getStoredGameResult("draw", "white")).toBe("draw");

    expect(getStoredGameResult("draw", "black")).toBe("draw");
  });
});
