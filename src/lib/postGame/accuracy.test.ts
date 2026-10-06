import { describe, expect, it } from "vitest";
import type {
  AnalyzedMove,
  MoveTier,
} from "./types";
import {
  calculatePlayerAccuracy,
  getMoveAccuracy,
} from "./accuracy";

function createMove(
  tier: MoveTier | null,
  playedBy: "white" | "black" = "white",
  isForcedMove = false
): AnalyzedMove {
  return {
    ply: 1,
    san: "e4",
    uci: "e2e4",
    fenBefore: "",
    fenAfter: "",
    playedBy,
    centipawnLoss: 0,
    tier,
    bestMoveUci: "e2e4",
    qualitySource: "centipawn",
    isForcedMove,
  };
}

describe("getMoveAccuracy", () => {
  it("uses the configured tier weights", () => {
    expect(getMoveAccuracy("diamond")).toBe(100);
    expect(getMoveAccuracy("platinum")).toBe(90);
    expect(getMoveAccuracy("gold")).toBe(80);
    expect(getMoveAccuracy("silver")).toBe(65);
    expect(getMoveAccuracy("bronze")).toBe(45);
    expect(getMoveAccuracy("steel")).toBe(30);
    expect(getMoveAccuracy("wood")).toBe(10);
  });
});

describe("calculatePlayerAccuracy", () => {
  it("averages tier accuracy values", () => {
    const moves = [
      createMove("diamond"),
      createMove("gold"),
      createMove("silver"),
      createMove("wood"),
    ];

    expect(
      calculatePlayerAccuracy(
        moves,
        "white"
      )
    ).toBeCloseTo(63.75);
  });

  it("only includes the requested player color", () => {
    const moves = [
      createMove("diamond", "white"),
      createMove("wood", "black"),
    ];

    expect(
      calculatePlayerAccuracy(
        moves,
        "white"
      )
    ).toBe(100);
  });

  it("excludes forced moves", () => {
    const moves = [
      createMove("wood", "white"),
      createMove(
        "diamond",
        "white",
        true
      ),
    ];

    expect(
      calculatePlayerAccuracy(
        moves,
        "white"
      )
    ).toBe(10);
  });

  it("excludes moves without a tier", () => {
    const moves = [
      createMove("gold"),
      createMove(null),
    ];

    expect(
      calculatePlayerAccuracy(
        moves,
        "white"
      )
    ).toBe(80);
  });

  it("returns null when there are no gradable moves", () => {
    const moves = [
      createMove(
        "diamond",
        "white",
        true
      ),
    ];

    expect(
      calculatePlayerAccuracy(
        moves,
        "white"
      )
    ).toBeNull();
  });
});