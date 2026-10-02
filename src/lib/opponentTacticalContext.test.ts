import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    OpponentCandidate,
  } from "./opponentMove";
  
  import {
    TACTICAL_GAP_CPL,
    TACTICAL_OPPORTUNITY_EVALUATION,
    getOpponentTacticalContext,
  } from "./opponentTacticalContext";
  
  
  function candidate(
    rank: number,
    centipawnLoss: number,
    evaluation = 0
  ): OpponentCandidate {
    return {
      rank,
      move: `move-${rank}`,
      evaluation,
      centipawnLoss,
      mate: null,
    };
  }
  
  
  describe("getOpponentTacticalContext", () => {
    it("treats an empty candidate list as normal", () => {
      expect(
        getOpponentTacticalContext([])
      ).toEqual({
        context: "normal",
        bestEvaluation: null,
        bestAlternativeLoss: null,
        tacticalGap: null,
      });
    });
  
  
    it("treats a single candidate as normal", () => {
      expect(
        getOpponentTacticalContext([
          candidate(1, 0),
        ])
      ).toEqual({
        context: "normal",
        bestEvaluation: null,
        bestAlternativeLoss: null,
        tacticalGap: null,
      });
    });
  
  
    it("classifies a small gap as normal", () => {
      const result =
        getOpponentTacticalContext([
          candidate(1, 0, 30),
          candidate(2, 40, -10),
          candidate(3, 90, -60),
        ]);
  
      expect(result.context).toBe(
        "normal"
      );
  
      expect(result.bestEvaluation).toBe(
        30
      );
  
      expect(
        result.bestAlternativeLoss
      ).toBe(40);
  
      expect(result.tacticalGap).toBe(
        40
      );
    });
  
  
    it("classifies a large gap without a winning evaluation as defensive", () => {
      const result =
        getOpponentTacticalContext([
          candidate(1, 0, 20),
          candidate(2, 180, -160),
          candidate(3, 300, -280),
        ]);
  
      expect(result.context).toBe(
        "defensive"
      );
  
      expect(result.bestEvaluation).toBe(
        20
      );
  
      expect(result.tacticalGap).toBe(
        180
      );
    });
  
  
    it("classifies a large gap with a strong positive evaluation as an opportunity", () => {
      const result =
        getOpponentTacticalContext([
          candidate(1, 0, 300),
          candidate(2, 180, 120),
          candidate(3, 300, 0),
        ]);
  
      expect(result.context).toBe(
        "opportunity"
      );
  
      expect(result.bestEvaluation).toBe(
        300
      );
  
      expect(result.tacticalGap).toBe(
        180
      );
    });
  
  
    it("treats the tactical gap threshold itself as tactical", () => {
      const result =
        getOpponentTacticalContext([
          candidate(1, 0, 0),
          candidate(
            2,
            TACTICAL_GAP_CPL,
            -150
          ),
        ]);
  
      expect(result.context).toBe(
        "defensive"
      );
    });
  
  
    it("treats the opportunity evaluation threshold itself as an opportunity", () => {
      const result =
        getOpponentTacticalContext([
          candidate(
            1,
            0,
            TACTICAL_OPPORTUNITY_EVALUATION
          ),
          candidate(2, 200, -50),
        ]);
  
      expect(result.context).toBe(
        "opportunity"
      );
    });
  
  
    it("sorts candidates before measuring the tactical gap", () => {
      const result =
        getOpponentTacticalContext([
          candidate(3, 300, -200),
          candidate(1, 10, 100),
          candidate(2, 170, -60),
        ]);
  
      expect(result.context).toBe(
        "defensive"
      );
  
      expect(result.bestEvaluation).toBe(
        100
      );
  
      expect(
        result.bestAlternativeLoss
      ).toBe(170);
  
      expect(result.tacticalGap).toBe(
        160
      );
    });
  
  
    it("does not mutate the original candidate order", () => {
      const candidates = [
        candidate(3, 300),
        candidate(1, 0),
        candidate(2, 200),
      ];
  
      const originalMoves =
        candidates.map(
          (item) => item.move
        );
  
      getOpponentTacticalContext(
        candidates
      );
  
      expect(
        candidates.map(
          (item) => item.move
        )
      ).toEqual(originalMoves);
    });
  });