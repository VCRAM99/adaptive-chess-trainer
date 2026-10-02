import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    MIDDLEGAME_CPL_MULTIPLIER,
    adjustMiddlegameDesiredCpl,
    isOpponentMiddlegame,
  } from "./opponentMiddlegame";
  
  describe("opponent middlegame calibration", () => {
    it("does not classify the starting position as middlegame", () => {
      const fen =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  
      expect(isOpponentMiddlegame(fen))
        .toBe(false);
    });
  
    it("recognizes a material-rich position after the opening", () => {
      const fen =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 15";
  
      expect(isOpponentMiddlegame(fen))
        .toBe(true);
    });
  
    it("does not classify a pawn endgame as middlegame", () => {
      const fen =
        "8/4k3/4p3/8/4P3/4K3/8/8 w - - 0 30";
  
      expect(isOpponentMiddlegame(fen))
        .toBe(false);
    });
  
    it("increases sampled desired CPL by 15%", () => {
      expect(
        adjustMiddlegameDesiredCpl(60)
      ).toBeCloseTo(69);
  
      expect(
        MIDDLEGAME_CPL_MULTIPLIER
      ).toBe(1.15);
    });
  
    it("preserves zero desired CPL", () => {
      expect(
        adjustMiddlegameDesiredCpl(0)
      ).toBe(0);
    });
  });