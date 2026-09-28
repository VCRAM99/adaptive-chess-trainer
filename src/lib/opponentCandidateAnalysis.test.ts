import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    createOpponentCandidates,
  } from "./opponentCandidateAnalysis";


  describe("createOpponentCandidates", () => {
    it("returns an empty array when no candidates exist", () => {
      expect(
        createOpponentCandidates(
          [],
          "black",
          "black"
        )
      ).toEqual([]);
    });

    it("normalizes evaluations to the black opponent perspective", () => {
        const candidates = [
          {
            rank: 1,
            move: "c7c5",
            evaluation: {
              type: "cp" as const,
              value: 40,
              depth: 8,
            },
          },
          {
            rank: 2,
            move: "e7e5",
            evaluation: {
              type: "cp" as const,
              value: 20,
              depth: 8,
            },
          },
        ];
      
        const result =
          createOpponentCandidates(
            candidates,
            "black",
            "black"
          );
      
        expect(result).toHaveLength(2);
      
        expect(result[0]).toEqual({
          rank: 1,
          move: "c7c5",
          evaluation: 40,
          centipawnLoss: 0,
        });
      
        expect(result[1]).toEqual({
          rank: 2,
          move: "e7e5",
          evaluation: 20,
          centipawnLoss: 20,
        });
      });

      it("supports an opponent whose color differs from the side to move", () => {
        const candidates = [
          {
            rank: 1,
            move: "e2e4",
            evaluation: {
              type: "cp" as const,
              value: 30,
              depth: 8,
            },
          },
        ];
      
        const result =
          createOpponentCandidates(
            candidates,
            "white",
            "black"
          );
      
        expect(result[0].evaluation).toBe(
          -30
        );
      });

      it("calculates candidate loss across zero", () => {
        const candidates = [
          {
            rank: 1,
            move: "c7c5",
            evaluation: {
              type: "cp" as const,
              value: 30,
              depth: 8,
            },
          },
          {
            rank: 2,
            move: "a7a6",
            evaluation: {
              type: "cp" as const,
              value: -70,
              depth: 8,
            },
          },
        ];
      
        const result =
          createOpponentCandidates(
            candidates,
            "black",
            "black"
          );
      
        expect(
          result[0].centipawnLoss
        ).toBe(0);
      
        expect(
          result[1].centipawnLoss
        ).toBe(100);
      });

      it("uses the strongest normalized evaluation as the CPL baseline", () => {
        const candidates = [
          {
            rank: 1,
            move: "a7a6",
            evaluation: {
              type: "cp" as const,
              value: 10,
              depth: 8,
            },
          },
          {
            rank: 2,
            move: "c7c5",
            evaluation: {
              type: "cp" as const,
              value: 30,
              depth: 8,
            },
          },
        ];
      
        const result =
          createOpponentCandidates(
            candidates,
            "black",
            "black"
          );
      
        expect(
          result[0].centipawnLoss
        ).toBe(20);
      
        expect(
          result[1].centipawnLoss
        ).toBe(0);
      });
  });


  