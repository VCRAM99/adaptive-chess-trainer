import { describe, expect, it } from "vitest";

import type { AnalyzedMove, MoveTier } from "./types";

import { calculateGameSummary } from "./gameSummary";

function createMove({
  ply,
  tier,
  centipawnLoss,
  playedBy = "white",
  forced = false,
  qualitySource = "centipawn",
}: {
  ply: number;
  tier: MoveTier | null;
  centipawnLoss: number | null;
  playedBy?: "white" | "black";
  forced?: boolean;
  qualitySource?: "centipawn" | "mate" | "unavailable";
}): AnalyzedMove {
  return {
    ply,
    san: `move-${ply}`,
    uci: "e2e4",
    fenBefore: "",
    fenAfter: "",
    playedBy,
    centipawnLoss,
    tier,
    bestMoveUci: "e2e4",
    qualitySource,
    isForcedMove: forced,
  };
}

describe("calculateGameSummary", () => {
  it("calculates player accuracy and tier counts", () => {
    const moves = [
      createMove({
        ply: 1,
        tier: "diamond",
        centipawnLoss: 5,
      }),

      createMove({
        ply: 2,
        tier: "wood",
        centipawnLoss: 300,
        playedBy: "black",
      }),

      createMove({
        ply: 3,
        tier: "gold",
        centipawnLoss: 40,
      }),

      createMove({
        ply: 5,
        tier: "silver",
        centipawnLoss: 70,
      }),
    ];

    const summary = calculateGameSummary(moves, "white");

    expect(summary.accuracy).toBeCloseTo((100 + 80 + 65) / 3);

    expect(summary.tierCounts.diamond).toBe(1);

    expect(summary.tierCounts.gold).toBe(1);

    expect(summary.tierCounts.silver).toBe(1);

    expect(summary.tierCounts.wood).toBe(0);

    expect(summary.totalPlayerMoves).toBe(3);

    expect(summary.gradableMoves).toBe(3);
  });

  it("excludes forced moves from accuracy and tier counts", () => {
    const moves = [
      createMove({
        ply: 1,
        tier: "wood",
        centipawnLoss: 300,
      }),

      createMove({
        ply: 3,
        tier: "diamond",
        centipawnLoss: 0,
        forced: true,
      }),
    ];

    const summary = calculateGameSummary(moves, "white");

    expect(summary.accuracy).toBe(10);

    expect(summary.gradableMoves).toBe(1);
    expect(summary.forcedMoves).toBe(1);

    expect(summary.tierCounts.diamond).toBe(0);

    expect(summary.tierCounts.wood).toBe(1);
  });

  it("calculates average CPL from centipawn moves only", () => {
    const moves = [
      createMove({
        ply: 1,
        tier: "diamond",
        centipawnLoss: 10,
      }),

      createMove({
        ply: 3,
        tier: "gold",
        centipawnLoss: 50,
      }),

      createMove({
        ply: 5,
        tier: "wood",
        centipawnLoss: 500,
        qualitySource: "mate",
      }),
    ];

    const summary = calculateGameSummary(moves, "white");

    expect(summary.averageCentipawnLoss).toBe(30);
  });

  it("finds the best move", () => {
    const moves = [
      createMove({
        ply: 1,
        tier: "gold",
        centipawnLoss: 40,
      }),

      createMove({
        ply: 3,
        tier: "diamond",
        centipawnLoss: 8,
      }),

      createMove({
        ply: 5,
        tier: "diamond",
        centipawnLoss: 2,
      }),
    ];

    const summary = calculateGameSummary(moves, "white");

    expect(summary.bestMove?.ply).toBe(5);
  });

  it("finds the biggest centipawn mistake", () => {
    const moves = [
      createMove({
        ply: 1,
        tier: "gold",
        centipawnLoss: 40,
      }),

      createMove({
        ply: 3,
        tier: "bronze",
        centipawnLoss: 120,
      }),

      createMove({
        ply: 5,
        tier: "wood",
        centipawnLoss: 350,
      }),
    ];

    const summary = calculateGameSummary(moves, "white");

    expect(summary.biggestMistake?.ply).toBe(5);
  });

  it("returns empty summary values when there are no gradable moves", () => {
    const moves = [
      createMove({
        ply: 1,
        tier: "diamond",
        centipawnLoss: 0,
        forced: true,
      }),
    ];

    const summary = calculateGameSummary(moves, "white");

    expect(summary.accuracy).toBeNull();

    expect(summary.averageCentipawnLoss).toBeNull();

    expect(summary.bestMove).toBeNull();

    expect(summary.biggestMistake).toBeNull();

    expect(summary.gradableMoves).toBe(0);
  });
});
