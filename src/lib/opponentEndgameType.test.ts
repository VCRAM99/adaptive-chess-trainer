import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    getEndgameMaterialProfile,
    getOpponentEndgameType,
  } from "./opponentEndgameType";
  
  
  describe(
    "getEndgameMaterialProfile",
    () => {
      it(
        "counts the relevant material",
        () => {
          const fen =
            "4r1k1/5pp1/8/8/8/8/5PPP/R2B2K1 w - - 0 1";
  
          expect(
            getEndgameMaterialProfile(
              fen
            )
          ).toEqual({
            queens: 0,
            rooks: 2,
            bishops: 1,
            knights: 0,
            pawns: 5,
          });
        }
      );
    }
  );
  
  
  describe(
    "getOpponentEndgameType",
    () => {
      it(
        "classifies a pawn endgame",
        () => {
          const fen =
            "8/5pk1/7p/8/8/6P1/5P1P/6K1 w - - 0 1";
  
          expect(
            getOpponentEndgameType(
              fen
            )
          ).toBe("pawn");
        }
      );
  
  
      it(
        "classifies a rook endgame",
        () => {
          const fen =
            "6k1/5pp1/8/8/8/8/5PPP/R5K1 w - - 0 1";
  
          expect(
            getOpponentEndgameType(
              fen
            )
          ).toBe("rook");
        }
      );
  
  
      it(
        "classifies rook plus minor material as a rook endgame",
        () => {
          const fen =
            "4r1k1/5pp1/8/8/8/8/5PPP/R2B2K1 w - - 0 1";
  
          expect(
            getOpponentEndgameType(
              fen
            )
          ).toBe("rook");
        }
      );
  
  
      it(
        "classifies a minor-piece endgame",
        () => {
          const fen =
            "6k1/5pp1/8/8/8/8/5PPP/2B3K1 w - - 0 1";
  
          expect(
            getOpponentEndgameType(
              fen
            )
          ).toBe("minor");
        }
      );
  
  
      it(
        "classifies knight endgames as minor",
        () => {
          const fen =
            "6k1/5pp1/8/8/8/8/5PPP/2N3K1 w - - 0 1";
  
          expect(
            getOpponentEndgameType(
              fen
            )
          ).toBe("minor");
        }
      );
  
  
      it(
        "gives queen endgames priority",
        () => {
          const fen =
            "3qr1k1/5pp1/8/8/8/8/5PPP/3Q2K1 w - - 0 1";
  
          expect(
            getOpponentEndgameType(
              fen
            )
          ).toBe("queen");
        }
      );
  
  
      it(
        "returns mixed when no relevant material remains",
        () => {
          const fen =
            "6k1/8/8/8/8/8/8/6K1 w - - 0 1";
  
          expect(
            getOpponentEndgameType(
              fen
            )
          ).toBe("mixed");
        }
      );
    }
  );