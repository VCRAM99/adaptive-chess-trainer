import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    ENDGAME_NON_PAWN_MATERIAL_THRESHOLD,
    getNonPawnMaterial,
    getOpponentGameStage,
    isOpponentEndgame,
  } from "./opponentEndgame";
  
  
  const STARTING_FEN =
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  
  
  describe(
    "getNonPawnMaterial",
    () => {
      it(
        "counts starting non-pawn material",
        () => {
          expect(
            getNonPawnMaterial(
              STARTING_FEN
            )
          ).toBe(62);
        }
      );
  
  
      it(
        "does not count kings or pawns",
        () => {
          const fen =
            "8/5pk1/7p/8/8/6P1/5P1P/6K1 w - - 0 1";
  
          expect(
            getNonPawnMaterial(fen)
          ).toBe(0);
        }
      );
  
  
      it(
        "counts remaining major and minor pieces",
        () => {
          const fen =
            "6k1/8/8/8/8/8/8/R2B2K1 w - - 0 1";
  
          expect(
            getNonPawnMaterial(fen)
          ).toBe(8);
        }
      );
    }
  );
  
  
  describe(
    "getOpponentGameStage",
    () => {
      it(
        "does not classify the starting position as an endgame",
        () => {
          expect(
            getOpponentGameStage(
              STARTING_FEN
            )
          ).toBe("non-endgame");
        }
      );
  
  
      it(
        "classifies a king-and-pawn position as an endgame",
        () => {
          const fen =
            "8/5pk1/7p/8/8/6P1/5P1P/6K1 w - - 0 1";
  
          expect(
            getOpponentGameStage(fen)
          ).toBe("endgame");
        }
      );
  
  
      it(
        "classifies low non-pawn material as an endgame",
        () => {
          const fen =
            "6k1/8/8/8/8/8/8/R2B2K1 w - - 0 1";
  
          expect(
            getOpponentGameStage(fen)
          ).toBe("endgame");
        }
      );
  
  
      it(
        "includes the threshold itself",
        () => {
          /*
           * White: Q = 9
           * Black: R = 5
           * Total = 14
           */
          const fen =
            "4r1k1/8/8/8/8/8/8/3Q2K1 w - - 0 1";
  
          expect(
            getNonPawnMaterial(fen)
          ).toBe(
            ENDGAME_NON_PAWN_MATERIAL_THRESHOLD
          );
  
          expect(
            getOpponentGameStage(fen)
          ).toBe("endgame");
        }
      );
  
  
      it(
        "does not classify material above the threshold as an endgame",
        () => {
          /*
           * White: Q + R = 14
           * Black: R = 5
           * Total = 19
           */
          const fen =
            "4r1k1/8/8/8/8/8/8/R2Q2K1 w - - 0 1";
  
          expect(
            getNonPawnMaterial(fen)
          ).toBe(19);
  
          expect(
            getOpponentGameStage(fen)
          ).toBe("non-endgame");
        }
      );
    }
  );
  
  
  describe(
    "isOpponentEndgame",
    () => {
      it(
        "returns true for an endgame",
        () => {
          const fen =
            "8/5pk1/7p/8/8/6P1/5P1P/6K1 w - - 0 1";
  
          expect(
            isOpponentEndgame(fen)
          ).toBe(true);
        }
      );
  
  
      it(
        "returns false for the starting position",
        () => {
          expect(
            isOpponentEndgame(
              STARTING_FEN
            )
          ).toBe(false);
        }
      );
    }
  );