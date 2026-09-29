import {
describe,
expect,
it,
} from "vitest";

import type {
OpponentCandidate,
} from "./opponentMove";

import {
MAX_NORMAL_OPPONENT_LOSS,
createSafeOpponentCandidatePool,
} from "./opponentMoveSafeguards";


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

describe(
    "createSafeOpponentCandidatePool",
    () => {
      it("handles an empty candidate pool", () => {
        const result =
          createSafeOpponentCandidatePool(
            []
          );
  
        expect(
          result.candidates
        ).toEqual([]);
  
        expect(
          result.bypassSelection
        ).toBe(false);
      });

      it("marks a single candidate as forced", () => {
        const onlyMove =
          candidate("e1e2", 0);
      
        const result =
          createSafeOpponentCandidatePool(
            [onlyMove]
          );
      
        expect(
          result.candidates
        ).toEqual([onlyMove]);
      
        expect(
          result.bypassSelection
        ).toBe(true);
      });
      it("keeps normal candidate losses", () => {
        const input = [
          candidate("a7a6", 0),
          candidate("b7b6", 30),
          candidate("c7c6", 90),
          candidate("d7d6", 190),
        ];
      
        const result =
          createSafeOpponentCandidatePool(
            input
          );
      
        expect(
          result.candidates
        ).toEqual(input);
      
        expect(
          result.bypassSelection
        ).toBe(false);
      });
      it("removes catastrophic outliers when enough alternatives exist", () => {
        const input = [
          candidate("a7a6", 0),
          candidate("b7b6", 80),
          candidate(
            "c7c6",
            MAX_NORMAL_OPPONENT_LOSS
          ),
          candidate("d7d6", 900),
        ];
      
        const result =
          createSafeOpponentCandidatePool(
            input
          );
      
        expect(
          result.candidates.map(
            (item) => item.move
          )
        ).toEqual([
          "a7a6",
          "b7b6",
          "c7c6",
        ]);
      });
      it("keeps the two least damaging moves when filtering would leave only one", () => {
        const input = [
          candidate("bad", 650),
          candidate("best", 0),
          candidate("awful", 900),
          candidate("second", 410),
        ];
      
        const result =
          createSafeOpponentCandidatePool(
            input
          );
      
        expect(
          result.candidates.map(
            (item) => item.move
          )
        ).toEqual([
          "best",
          "second",
        ]);
      
        expect(
          result.bypassSelection
        ).toBe(false);
      });
      it("does not mutate the original candidate array", () => {
        const input = [
          candidate("bad", 700),
          candidate("best", 0),
          candidate("second", 400),
        ];
      
        const originalOrder =
          input.map(
            (item) => item.move
          );
      
        createSafeOpponentCandidatePool(
          input
        );
      
        expect(
          input.map(
            (item) => item.move
          )
        ).toEqual(
          originalOrder
        );
      });
      it("prioritizes a winning mate over normal candidates", () => {
        const input = [
          candidate("normal", 0),
          candidate("mate", 0, 3),
          candidate("mistake", 100),
        ];
      
        const result =
          createSafeOpponentCandidatePool(
            input
          );
      
        expect(
          result.candidates.map(
            (item) => item.move
          )
        ).toEqual(["mate"]);
      
        expect(
          result.bypassSelection
        ).toBe(true);
      });

      it("prefers the shortest winning mate", () => {
        const input = [
          candidate("mate5", 0, 5),
          candidate("mate2", 0, 2),
          candidate("mate4", 0, 4),
        ];
      
        const result =
          createSafeOpponentCandidatePool(
            input
          );
      
        expect(
          result.candidates.map(
            (item) => item.move
          )
        ).toEqual(["mate2"]);
        
        expect(
          result.bypassSelection
        ).toBe(true);
      });

      it("keeps equally fast winning mates", () => {
        const input = [
          candidate("mate2a", 0, 2),
          candidate("mate4", 0, 4),
          candidate("mate2b", 0, 2),
        ];
      
        const result =
          createSafeOpponentCandidatePool(
            input
          );
      
        expect(
          result.candidates.map(
            (item) => item.move
          )
        ).toEqual([
          "mate2a",
          "mate2b",
        ]);
      });
    }
  );