import { describe, expect, it } from "vitest";

import type { OpponentCandidate } from "./opponentMove";

import {
  RECOGNIZED_TACTIC_MAX_CPL,
  getRecognizedTacticalCandidates,
} from "./opponentTacticalSelection";

function candidate(rank: number, centipawnLoss: number): OpponentCandidate {
  return {
    rank,
    move: `move-${rank}`,
    evaluation: 0,
    centipawnLoss,
    mate: null,
  };
}

describe("getRecognizedTacticalCandidates", () => {
  it("returns an empty array for no candidates", () => {
    expect(getRecognizedTacticalCandidates([])).toEqual([]);
  });

  it("keeps a single candidate", () => {
    const result = getRecognizedTacticalCandidates([candidate(1, 0)]);

    expect(result).toHaveLength(1);
    expect(result[0].move).toBe("move-1");
  });

  it("keeps candidates close to the best move", () => {
    const result = getRecognizedTacticalCandidates([
      candidate(1, 0),
      candidate(2, 20),
      candidate(3, 35),
      candidate(4, 100),
    ]);

    expect(result.map((item) => item.move)).toEqual(["move-1", "move-2", "move-3"]);
  });

  it("includes a candidate exactly at the tactical limit", () => {
    const result = getRecognizedTacticalCandidates([
      candidate(1, 0),
      candidate(2, RECOGNIZED_TACTIC_MAX_CPL),
      candidate(3, 100),
    ]);

    expect(result).toHaveLength(2);
  });

  it("measures the limit relative to the best candidate loss", () => {
    const result = getRecognizedTacticalCandidates([
      candidate(1, 10),
      candidate(2, 30),
      candidate(3, 50),
      candidate(4, 60),
    ]);

    expect(result.map((item) => item.centipawnLoss)).toEqual([10, 30, 50]);
  });

  it("sorts candidates by centipawn loss", () => {
    const result = getRecognizedTacticalCandidates([
      candidate(3, 35),
      candidate(1, 0),
      candidate(4, 100),
      candidate(2, 20),
    ]);

    expect(result.map((item) => item.move)).toEqual(["move-1", "move-2", "move-3"]);
  });

  it("does not mutate the original candidate order", () => {
    const candidates = [candidate(3, 35), candidate(1, 0), candidate(2, 20)];

    const originalMoves = candidates.map((item) => item.move);

    getRecognizedTacticalCandidates(candidates);

    expect(candidates.map((item) => item.move)).toEqual(originalMoves);
  });
});
