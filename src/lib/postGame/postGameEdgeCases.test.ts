import { describe, expect, it } from "vitest";
import type { AnalyzedMove } from "./types";
import { calculateGameSummary } from "./gameSummary";
import { calculatePlayerAccuracy } from "./accuracy";

function createMove(
  overrides: Partial<AnalyzedMove> = {}
): AnalyzedMove {
  return {
    ply: 1,
    san: "e4",
    uci: "e2e4",
    fenBefore: "",
    fenAfter: "",
    playedBy: "white",

    centipawnLoss: 0,
    tier: "diamond",
    bestMoveUci: "e2e4",
    qualitySource: "centipawn",
    isForcedMove: false,

    ...overrides,
  };
}

describe("post-game analysis edge cases", () => {
  it("returns null accuracy when the player has no moves", () => {
    const moves: AnalyzedMove[] = [];

    expect(
      calculatePlayerAccuracy(
        moves,
        "white"
      )
    ).toBeNull();
  });

  it("excludes forced moves from accuracy", () => {
    const moves: AnalyzedMove[] = [
      createMove({
        ply: 1,
        tier: "wood",
        isForcedMove: true,
      }),

      createMove({
        ply: 3,
        tier: "gold",
        isForcedMove: false,
      }),
    ];

    expect(
      calculatePlayerAccuracy(
        moves,
        "white"
      )
    ).toBe(80);
  });

  it("excludes ungradable moves from accuracy", () => {
    const moves: AnalyzedMove[] = [
      createMove({
        ply: 1,
        tier: null,
        centipawnLoss: null,
        qualitySource: "unavailable",
      }),

      createMove({
        ply: 3,
        tier: "platinum",
      }),
    ];

    expect(
      calculatePlayerAccuracy(
        moves,
        "white"
      )
    ).toBe(90);
  });

  it("does not count opponent moves in player accuracy", () => {
    const moves: AnalyzedMove[] = [
      createMove({
        ply: 1,
        playedBy: "white",
        tier: "diamond",
      }),

      createMove({
        ply: 2,
        playedBy: "black",
        tier: "wood",
      }),
    ];

    expect(
      calculatePlayerAccuracy(
        moves,
        "white"
      )
    ).toBe(100);
  });

  it("returns null accuracy when every player move is forced", () => {
    const moves: AnalyzedMove[] = [
      createMove({
        ply: 1,
        tier: "diamond",
        isForcedMove: true,
      }),

      createMove({
        ply: 3,
        tier: "diamond",
        isForcedMove: true,
      }),
    ];

    expect(
      calculatePlayerAccuracy(
        moves,
        "white"
      )
    ).toBeNull();
  });

  it("does not include mate penalties in average CPL", () => {
    const moves: AnalyzedMove[] = [
      createMove({
        ply: 1,
        centipawnLoss: 20,
        tier: "platinum",
        qualitySource: "centipawn",
      }),

      createMove({
        ply: 3,
        centipawnLoss: 500,
        tier: "wood",
        qualitySource: "mate",
      }),
    ];

    const summary =
      calculateGameSummary(
        moves,
        "white"
      );

    expect(
      summary.averageCentipawnLoss
    ).toBe(20);
  });

  it("returns null average CPL when there are no centipawn-graded moves", () => {
    const moves: AnalyzedMove[] = [
      createMove({
        centipawnLoss: 500,
        tier: "wood",
        qualitySource: "mate",
      }),
    ];

    const summary =
      calculateGameSummary(
        moves,
        "white"
      );

    expect(
      summary.averageCentipawnLoss
    ).toBeNull();
  });

  it("counts forced moves separately from gradable moves", () => {
    const moves: AnalyzedMove[] = [
      createMove({
        ply: 1,
        isForcedMove: true,
      }),

      createMove({
        ply: 3,
        tier: "gold",
        isForcedMove: false,
      }),

      createMove({
        ply: 5,
        tier: null,
        centipawnLoss: null,
        qualitySource: "unavailable",
        isForcedMove: false,
      }),
    ];

    const summary =
      calculateGameSummary(
        moves,
        "white"
      );

    expect(summary.totalPlayerMoves).toBe(
      3
    );

    expect(summary.forcedMoves).toBe(1);

    expect(summary.gradableMoves).toBe(1);
  });
});