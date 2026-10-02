import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    OPENING_MAX_FULL_MOVE,
    getOpponentGamePhase,
    isOpponentOpeningPhase,
    getFullMoveNumberFromFen,
  } from "./opponentOpening";
  
  
  describe(
    "getOpponentGamePhase",
    () => {
      it("classifies move 1 as opening", () => {
        expect(
          getOpponentGamePhase(1)
        ).toBe("opening");
      });
  
  
      it("classifies the opening boundary as opening", () => {
        expect(
          getOpponentGamePhase(
            OPENING_MAX_FULL_MOVE
          )
        ).toBe("opening");
      });
  
  
      it("classifies the move after the boundary as post-opening", () => {
        expect(
          getOpponentGamePhase(
            OPENING_MAX_FULL_MOVE + 1
          )
        ).toBe("post-opening");
      });
  
  
      it("normalizes values below move 1", () => {
        expect(
          getOpponentGamePhase(0)
        ).toBe("opening");
  
        expect(
          getOpponentGamePhase(-5)
        ).toBe("opening");
      });
  
  
      it("floors fractional move numbers", () => {
        expect(
          getOpponentGamePhase(10.9)
        ).toBe("opening");
  
        expect(
          getOpponentGamePhase(11.1)
        ).toBe("post-opening");
      });
    }
  );
  
  
  describe(
    "isOpponentOpeningPhase",
    () => {
      it("returns true during the opening", () => {
        expect(
          isOpponentOpeningPhase(5)
        ).toBe(true);
      });
  
  
      it("returns false after the opening", () => {
        expect(
          isOpponentOpeningPhase(15)
        ).toBe(false);
      });
    }
  );

  describe(
    "getFullMoveNumberFromFen",
    () => {
      it("reads the full-move number from FEN", () => {
        expect(
          getFullMoveNumberFromFen(
            "8/8/8/8/8/8/8/8 w - - 0 7"
          )
        ).toBe(7);
      });
  
  
      it("normalizes invalid move numbers", () => {
        expect(
          getFullMoveNumberFromFen(
            "8/8/8/8/8/8/8/8 w - - 0 0"
          )
        ).toBe(1);
      });
    }
  );