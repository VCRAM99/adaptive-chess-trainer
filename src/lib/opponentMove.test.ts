import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    calculateCandidateLoss,
    createOpponentCandidate,
    filterCandidatesByMaxLoss,
  } from "./opponentMove";
  
  describe("calculateCandidateLoss", () => {
    it("returns zero for the best move", () => {
      expect(
        calculateCandidateLoss(
          40,
          40
        )
      ).toBe(0);
    });
  
    it("calculates loss for a weaker candidate", () => {
      expect(
        calculateCandidateLoss(
          40,
          10
        )
      ).toBe(30);
    });
  
    it("handles evaluation crossing zero", () => {
      expect(
        calculateCandidateLoss(
          25,
          -75
        )
      ).toBe(100);
    });
  
    it("does not return negative loss", () => {
      expect(
        calculateCandidateLoss(
          20,
          30
        )
      ).toBe(0);
    });
  });
  
  describe("createOpponentCandidate", () => {
    it("creates a candidate with calculated loss", () => {
      expect(
        createOpponentCandidate({
          rank: 3,
          move: "g8f6",
          evaluation: 15,
          bestEvaluation: 50,
        })
      ).toEqual({
        rank: 3,
        move: "g8f6",
        evaluation: 15,
        centipawnLoss: 35,
      });
    });
  });

  describe("filterCandidatesByMaxLoss", () => {
    const candidates = [
      {
        rank: 1,
        move: "e7e5",
        evaluation: 20,
        centipawnLoss: 0,
      },
      {
        rank: 2,
        move: "c7c5",
        evaluation: 5,
        centipawnLoss: 15,
      },
      {
        rank: 3,
        move: "a7a6",
        evaluation: -40,
        centipawnLoss: 60,
      },
      {
        rank: 4,
        move: "f7f6",
        evaluation: -250,
        centipawnLoss: 270,
      },
    ];
  
    it("keeps candidates within the maximum loss", () => {
      expect(
        filterCandidatesByMaxLoss(
          candidates,
          60
        )
      ).toEqual(
        candidates.slice(0, 3)
      );
    });
  
    it("removes candidates above the maximum loss", () => {
      const filtered =
        filterCandidatesByMaxLoss(
          candidates,
          20
        );
  
      expect(filtered).toHaveLength(2);
  
      expect(
        filtered.map(
          (candidate) => candidate.move
        )
      ).toEqual([
        "e7e5",
        "c7c5",
      ]);
    });

    it("returns an empty array when there are no candidates", () => {
      expect(
        filterCandidatesByMaxLoss(
          [],
          100
        )
      ).toEqual([]);
    });
    
    it("does not allow a negative maximum loss to remove the best move", () => {
      const candidates = [
        {
          rank: 1,
          move: "e7e5",
          evaluation: 20,
          centipawnLoss: 0,
        },
      ];
    
      expect(
        filterCandidatesByMaxLoss(
          candidates,
          -50
        )
      ).toEqual(candidates);
    });
  });