import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    OpponentCandidate,
  } from "./opponentMove";
  
  import {
    filterRecognizedEndgameCandidates,
    getRecognizedEndgameMaxCpl,
  } from "./opponentEndgameSelection";
  
  
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
    "getRecognizedEndgameMaxCpl",
    () => {
      it(
        "does not filter quiet decisions",
        () => {
          expect(
            getRecognizedEndgameMaxCpl(
              "quiet"
            )
          ).toBeNull();
        }
      );
  
  
      it(
        "narrows the window as importance increases",
        () => {
          const meaningful =
            getRecognizedEndgameMaxCpl(
              "meaningful"
            )!;
  
          const critical =
            getRecognizedEndgameMaxCpl(
              "critical"
            )!;
  
          const forcing =
            getRecognizedEndgameMaxCpl(
              "forcing"
            )!;
  
          expect(critical)
            .toBeLessThan(meaningful);
  
          expect(forcing)
            .toBeLessThan(critical);
        }
      );
    }
  );
  
  
  describe(
    "filterRecognizedEndgameCandidates",
    () => {
      it(
        "keeps every candidate for quiet decisions",
        () => {
          const candidates = [
            candidate(1, 0),
            candidate(2, 40),
            candidate(3, 100),
          ];
  
          expect(
            filterRecognizedEndgameCandidates(
              candidates,
              "quiet"
            )
          ).toEqual(candidates);
        }
      );
  
  
      it(
        "keeps competitive candidates for a meaningful decision",
        () => {
          const result =
            filterRecognizedEndgameCandidates(
              [
                candidate(1, 0),
                candidate(2, 18),
                candidate(3, 47),
                candidate(4, 80),
              ],
              "meaningful"
            );
  
          expect(
            result.map(
              (item) => item.centipawnLoss
            )
          ).toEqual([
            0,
            18,
            47,
          ]);
        }
      );
  
  
      it(
        "uses a tighter window for critical decisions",
        () => {
          const result =
            filterRecognizedEndgameCandidates(
              [
                candidate(1, 0),
                candidate(2, 18),
                candidate(3, 34),
                candidate(4, 40),
                candidate(5, 90),
              ],
              "critical"
            );
  
          expect(
            result.map(
              (item) => item.centipawnLoss
            )
          ).toEqual([
            0,
            18,
            34,
          ]);
        }
      );
  
  
      it(
        "uses the tightest window for forcing decisions",
        () => {
          const result =
            filterRecognizedEndgameCandidates(
              [
                candidate(1, 0),
                candidate(2, 12),
                candidate(3, 20),
                candidate(4, 21),
                candidate(5, 80),
              ],
              "forcing"
            );
  
          expect(
            result.map(
              (item) => item.centipawnLoss
            )
          ).toEqual([
            0,
            12,
            20,
          ]);
        }
      );
  
  
      it(
        "measures the cutoff relative to the best candidate",
        () => {
          const result =
            filterRecognizedEndgameCandidates(
              [
                candidate(1, 10),
                candidate(2, 30),
                candidate(3, 44),
                candidate(4, 46),
              ],
              "critical"
            );
  
          expect(
            result.map(
              (item) => item.centipawnLoss
            )
          ).toEqual([
            10,
            30,
            44,
          ]);
        }
      );
  
  
      it(
        "does not mutate the original array",
        () => {
          const candidates = [
            candidate(1, 0),
            candidate(2, 50),
            candidate(3, 100),
          ];
  
          const original =
            [...candidates];
  
          filterRecognizedEndgameCandidates(
            candidates,
            "critical"
          );
  
          expect(candidates)
            .toEqual(original);
        }
      );
  
  
      it(
        "handles an empty pool",
        () => {
          expect(
            filterRecognizedEndgameCandidates(
              [],
              "critical"
            )
          ).toEqual([]);
        }
      );
    }
  );