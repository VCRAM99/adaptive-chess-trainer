import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    OpponentCandidate,
  } from "./opponentMove";
  
  import {
    chooseAdaptiveOpponentMove,
  } from "./opponentDecision";
  
  function candidate(
    move: string,
    centipawnLoss: number,
    mate: number | null = null
  ): OpponentCandidate {
    return {
      rank: 1,
      move,
      evaluation: 0,
      centipawnLoss,
      mate,
    };
  }
  
  describe("chooseAdaptiveOpponentMove", () => {
    it("returns no move when no candidates exist", () => {
      const result =
        chooseAdaptiveOpponentMove(
          [],
          1200,
          0.5
        );
  
      expect(
        result.candidate
      ).toBeNull();
  
      expect(
        result.bypassedSelection
      ).toBe(false);
    });
  
    it("bypasses selection when only one candidate exists", () => {
      const onlyMove =
        candidate(
          "e1e2",
          0
        );
  
      const result =
        chooseAdaptiveOpponentMove(
          [onlyMove],
          1200,
          0.5
        );
  
      expect(
        result.candidate
      ).toEqual(onlyMove);
  
      expect(
        result.bypassedSelection
      ).toBe(true);
    });
  
    it("chooses a winning mate instead of using normal weighted selection", () => {
      const input = [
        candidate(
          "normal",
          0
        ),
        candidate(
          "mate",
          0,
          2
        ),
        candidate(
          "mistake",
          100
        ),
      ];
  
      const result =
        chooseAdaptiveOpponentMove(
          input,
          600,
          0.999
        );
  
      expect(
        result.candidate?.move
      ).toBe("mate");
  
      expect(
        result.bypassedSelection
      ).toBe(true);
    });
  
    it("does not select a catastrophic candidate when safe alternatives exist", () => {
      const input = [
        candidate(
          "best",
          0
        ),
        candidate(
          "good",
          20
        ),
        candidate(
          "catastrophic",
          900
        ),
      ];
  
      const result =
        chooseAdaptiveOpponentMove(
          input,
          600,
          0.999999
        );
  
      expect(
        result.candidate?.move
      ).not.toBe(
        "catastrophic"
      );
  
      expect(
        result.bypassedSelection
      ).toBe(false);
    });
  
    it("selects from the safe candidate pool during normal play", () => {
      const input = [
        candidate(
          "excellent",
          0
        ),
        candidate(
          "good",
          20
        ),
        candidate(
          "inaccuracy",
          50
        ),
        candidate(
          "mistake",
          120
        ),
      ];
  
      const result =
        chooseAdaptiveOpponentMove(
          input,
          1200,
          0
        );
  
      expect(
        result.candidate
      ).not.toBeNull();
  
      expect(
        input
      ).toContainEqual(
        result.candidate
      );
  
      expect(
        result.bypassedSelection
      ).toBe(false);
    });
  
    it("chooses the shortest available winning mate", () => {
      const input = [
        candidate(
          "mate5",
          0,
          5
        ),
        candidate(
          "mate2",
          0,
          2
        ),
        candidate(
          "mate4",
          0,
          4
        ),
      ];
  
      const result =
        chooseAdaptiveOpponentMove(
          input,
          1200,
          0.5
        );
  
      expect(
        result.candidate?.move
      ).toBe("mate2");
  
      expect(
        result.bypassedSelection
      ).toBe(true);
    });
  });