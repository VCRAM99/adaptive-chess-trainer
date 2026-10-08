import { describe, expect, it } from "vitest";

import type { AnalyzedMove, MoveTier } from "./types";

import { calculateMatchSummary } from "./matchSummary";

function createMove(
  ply: number,
  playedBy: "white" | "black",
  tier: MoveTier,
  centipawnLoss: number,
): AnalyzedMove {
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
    qualitySource: "centipawn",
    isForcedMove: false,
  };
}

describe("calculateMatchSummary", () => {
  it("calculates player and opponent summaries", () => {
    const moves = [
      createMove(1, "white", "diamond", 5),
      createMove(2, "black", "wood", 300),
      createMove(3, "white", "gold", 40),
      createMove(4, "black", "silver", 70),
    ];

    const summary = calculateMatchSummary(moves, "white");

    expect(summary.player.accuracy).toBe(90);

    expect(summary.opponent.accuracy).toBe(37.5);

    expect(summary.player.totalPlayerMoves).toBe(2);

    expect(summary.opponent.totalPlayerMoves).toBe(2);
  });

  it("works when the player is black", () => {
    const moves = [createMove(1, "white", "wood", 300), createMove(2, "black", "diamond", 5)];

    const summary = calculateMatchSummary(moves, "black");

    expect(summary.player.accuracy).toBe(100);

    expect(summary.opponent.accuracy).toBe(10);
  });
});
