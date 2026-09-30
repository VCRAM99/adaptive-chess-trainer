import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  OpponentCandidate,
} from "./opponentMove";

import {
  chooseOpeningAwareCandidate,
  createOpeningCandidateSelections,
} from "./opponentOpeningSelection";


const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";


function candidate(
  rank: number,
  move: string,
  centipawnLoss: number
): OpponentCandidate {
  return {
    rank,
    move,
    evaluation: 0,
    centipawnLoss,
    mate: null,
  };
}


describe(
  "createOpeningCandidateSelections",
  () => {
    it("reduces selection distance for development", () => {
      const result =
        createOpeningCandidateSelections(
          [
            candidate(
              1,
              "g1f3",
              30
            ),
          ],
          20,
          STARTING_FEN,
          2400
        );

      expect(
        result[0].baseDistance
      ).toBe(10);

      expect(
        result[0].openingAdjustment
      ).toBeLessThan(0);

      expect(
        result[0].selectionDistance
      ).toBeLessThan(
        result[0].baseDistance
      );
    });


    it("increases selection distance for a flank pawn move", () => {
      const result =
        createOpeningCandidateSelections(
          [
            candidate(
              1,
              "h2h3",
              30
            ),
          ],
          20,
          STARTING_FEN,
          2400
        );

      expect(
        result[0].baseDistance
      ).toBe(10);

      expect(
        result[0].openingAdjustment
      ).toBeGreaterThan(0);

      expect(
        result[0].selectionDistance
      ).toBeGreaterThan(
        result[0].baseDistance
      );
    });


    it("never creates negative selection distance", () => {
      const result =
        createOpeningCandidateSelections(
          [
            candidate(
              1,
              "g1f3",
              20
            ),
          ],
          20,
          STARTING_FEN,
          2400
        );

      expect(
        result[0].selectionDistance
      ).toBe(0);
    });


    it("does not mutate objective candidate CPL", () => {
      const original =
        candidate(
          1,
          "g1f3",
          30
        );

      createOpeningCandidateSelections(
        [original],
        20,
        STARTING_FEN,
        2400
      );

      expect(
        original.centipawnLoss
      ).toBe(30);
    });
  }
);


describe(
  "chooseOpeningAwareCandidate",
  () => {
    it("can prefer development between similarly suitable moves", () => {
      const candidates = [
        candidate(
          1,
          "g1f3",
          30
        ),
        candidate(
          2,
          "d2d3",
          28
        ),
      ];

      const selected =
        chooseOpeningAwareCandidate(
          candidates,
          25,
          STARTING_FEN,
          2400
        );

      expect(
        selected?.move
      ).toBe("g1f3");
    });


    it("can discourage a flank pawn between similarly suitable moves", () => {
      const candidates = [
        candidate(
          1,
          "d2d3",
          30
        ),
        candidate(
          2,
          "h2h3",
          28
        ),
      ];

      const selected =
        chooseOpeningAwareCandidate(
          candidates,
          25,
          STARTING_FEN,
          2400
        );

      expect(
        selected?.move
      ).toBe("d2d3");
    });


    it("does not let opening preference overcome a large objective mismatch", () => {
      const candidates = [
        candidate(
          1,
          "d2d3",
          5
        ),
        candidate(
          2,
          "g1f3",
          150
        ),
      ];

      const selected =
        chooseOpeningAwareCandidate(
          candidates,
          5,
          STARTING_FEN,
          2400
        );

      expect(
        selected?.move
      ).toBe("d2d3");
    });


    it("returns null for an empty candidate pool", () => {
      expect(
        chooseOpeningAwareCandidate(
          [],
          20,
          STARTING_FEN,
          1200
        )
      ).toBeNull();
    });


    it("returns the original candidate object", () => {
      const original =
        candidate(
          1,
          "g1f3",
          30
        );

      const selected =
        chooseOpeningAwareCandidate(
          [original],
          20,
          STARTING_FEN,
          2400
        );

      expect(selected).toBe(original);

      expect(
        selected?.centipawnLoss
      ).toBe(30);
    });
  }
);