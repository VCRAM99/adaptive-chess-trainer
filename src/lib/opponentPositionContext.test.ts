import { describe, expect, it } from "vitest";
import type { OpponentCandidate } from "./opponentMove";
import {
  getOpponentPositionContext,
  getOpponentErrorScale,
  PLAUSIBLE_MOVE_CPL,
} from "./opponentPositionContext";

function candidate(
  rank: number,
  centipawnLoss: number
): OpponentCandidate {
  return {
    rank,
    move: `move${rank}`,
    evaluation: -centipawnLoss,
    centipawnLoss,
    mate: null,
  };
}

describe("getOpponentPositionContext", () => {
    it("treats an empty candidate list as forced", () => {
      const result =
        getOpponentPositionContext([]);
  
      expect(result.context).toBe("forced");
      expect(result.candidateCount).toBe(0);
      expect(result.plausibleCandidateCount).toBe(0);
      expect(result.bestAlternativeLoss).toBeNull();
    });
  
    it("treats a single candidate as forced", () => {
      const result =
        getOpponentPositionContext([
          candidate(1, 0),
        ]);
  
      expect(result.context).toBe("forced");
      expect(result.candidateCount).toBe(1);
      expect(result.plausibleCandidateCount).toBe(1);
      expect(result.bestAlternativeLoss).toBeNull();
    });
  
    it("treats a position with no plausible alternative as forced", () => {
      const result =
        getOpponentPositionContext([
          candidate(1, 0),
          candidate(2, 220),
          candidate(3, 340),
        ]);
  
      expect(result.context).toBe("forced");
      expect(result.bestAlternativeLoss).toBe(220);
    });
  
    it("treats two plausible moves as limited", () => {
      const result =
        getOpponentPositionContext([
          candidate(1, 0),
          candidate(2, 80),
          candidate(3, 240),
        ]);
  
      expect(result.context).toBe("limited");
      expect(result.plausibleCandidateCount).toBe(2);
    });
  
    it("treats several plausible moves as flexible", () => {
      const result =
        getOpponentPositionContext([
          candidate(1, 0),
          candidate(2, 25),
          candidate(3, 55),
          candidate(4, 75),
          candidate(5, 120),
        ]);
  
      expect(result.context).toBe("flexible");
      expect(result.plausibleCandidateCount).toBe(4);
    });
  
    it("treats many plausible moves as wide", () => {
      const result =
        getOpponentPositionContext([
          candidate(1, 0),
          candidate(2, 10),
          candidate(3, 20),
          candidate(4, 35),
          candidate(5, 50),
          candidate(6, 70),
          candidate(7, 120),
        ]);
  
      expect(result.context).toBe("wide");
      expect(result.plausibleCandidateCount).toBe(6);
    });
  
    it("includes the CPL threshold itself as plausible", () => {
      const result =
        getOpponentPositionContext([
          candidate(1, 0),
          candidate(
            2,
            PLAUSIBLE_MOVE_CPL
          ),
        ]);
  
      expect(result.context).toBe("limited");
      expect(result.plausibleCandidateCount).toBe(2);
    });
  
    it("does not mutate the original candidate order", () => {
      const candidates = [
        candidate(3, 100),
        candidate(1, 0),
        candidate(2, 50),
      ];
  
      getOpponentPositionContext(candidates);
  
      expect(
        candidates.map(
          (item) => item.centipawnLoss
        )
      ).toEqual([100, 0, 50]);
    });
  });

  describe("getOpponentErrorScale", () => {
    it("strongly reduces errors in forced positions", () => {
      expect(
        getOpponentErrorScale("forced")
      ).toBe(0.35);
    });
  
    it("strongly reduces errors in limited positions", () => {
      expect(
        getOpponentErrorScale("limited")
      ).toBe(0.6);
    });
  
    it("slightly reduces errors in flexible positions", () => {
      expect(
        getOpponentErrorScale("flexible")
      ).toBe(0.85);
    });
  
    it("keeps the full error model in wide positions", () => {
      expect(
        getOpponentErrorScale("wide")
      ).toBe(1);
    });
  });