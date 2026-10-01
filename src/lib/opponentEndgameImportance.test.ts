import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    OpponentCandidate,
  } from "./opponentMove";
  
  import {
    getEndgameDecisionImportance,
  } from "./opponentEndgameImportance";
  
  
  function candidate(
    rank: number,
    centipawnLoss: number
  ): OpponentCandidate {
    return {
      rank,
      move: `move${rank}`,
      evaluation: 0,
      centipawnLoss,
      mate: null,
    };
  }
  
  
  describe(
    "getEndgameDecisionImportance",
    () => {
      it(
        "classifies close alternatives as quiet",
        () => {
          const result =
            getEndgameDecisionImportance([
              candidate(1, 0),
              candidate(2, 12),
              candidate(3, 30),
            ]);
  
          expect(
            result.importance
          ).toBe("quiet");
  
          expect(result.gap).toBe(12);
        }
      );
  
  
      it(
        "classifies a meaningful gap",
        () => {
          const result =
            getEndgameDecisionImportance([
              candidate(1, 0),
              candidate(2, 35),
              candidate(3, 70),
            ]);
  
          expect(
            result.importance
          ).toBe("meaningful");
        }
      );
  
  
      it(
        "classifies a critical gap",
        () => {
          const result =
            getEndgameDecisionImportance([
              candidate(1, 0),
              candidate(2, 90),
              candidate(3, 130),
            ]);
  
          expect(
            result.importance
          ).toBe("critical");
        }
      );
  
  
      it(
        "classifies a forcing gap",
        () => {
          const result =
            getEndgameDecisionImportance([
              candidate(1, 0),
              candidate(2, 180),
              candidate(3, 220),
            ]);
  
          expect(
            result.importance
          ).toBe("forcing");
        }
      );
  
  
      it(
        "treats a single candidate as forcing",
        () => {
          const result =
            getEndgameDecisionImportance([
              candidate(1, 0),
            ]);
  
          expect(
            result.importance
          ).toBe("forcing");
  
          expect(
            result.secondBestLoss
          ).toBeNull();
  
          expect(
            result.gap
          ).toBeNull();
        }
      );
  
  
      it(
        "handles an empty candidate pool",
        () => {
          const result =
            getEndgameDecisionImportance(
              []
            );
  
          expect(
            result.importance
          ).toBe("forcing");
  
          expect(
            result.bestLoss
          ).toBeNull();
        }
      );
  
  
      it(
        "sorts candidates without mutating them",
        () => {
          const candidates = [
            candidate(1, 80),
            candidate(2, 0),
            candidate(3, 30),
          ];
  
          const originalOrder =
            candidates.map(
              (item) =>
                item.centipawnLoss
            );
  
          const result =
            getEndgameDecisionImportance(
              candidates
            );
  
          expect(
            result.bestLoss
          ).toBe(0);
  
          expect(
            result.secondBestLoss
          ).toBe(30);
  
          expect(
            result.importance
          ).toBe("meaningful");
  
          expect(
            candidates.map(
              (item) =>
                item.centipawnLoss
            )
          ).toEqual(
            originalOrder
          );
        }
      );
      it(
        "keeps the exact quiet boundary quiet",
        () => {
          const result =
            getEndgameDecisionImportance([
              candidate(1, 0),
              candidate(2, 20),
            ]);
      
          expect(
            result.importance
          ).toBe("quiet");
        }
      );
      
      
      it(
        "keeps the exact critical boundary meaningful",
        () => {
          const result =
            getEndgameDecisionImportance([
              candidate(1, 0),
              candidate(2, 60),
            ]);
      
          expect(
            result.importance
          ).toBe("meaningful");
        }
      );
      
      
      it(
        "keeps the exact forcing boundary critical",
        () => {
          const result =
            getEndgameDecisionImportance([
              candidate(1, 0),
              candidate(2, 120),
            ]);
      
          expect(
            result.importance
          ).toBe("critical");
        }
      );
    }
  );