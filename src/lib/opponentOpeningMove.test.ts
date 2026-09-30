import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    getOpeningMoveCharacteristics,
  } from "./opponentOpeningMove";
  
  
  const STARTING_FEN =
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  
  
  describe(
    "getOpeningMoveCharacteristics",
    () => {
      it("detects a central king pawn move", () => {
        const result =
          getOpeningMoveCharacteristics(
            STARTING_FEN,
            "e2e4"
          );
  
        expect(
          result.movesCentralPawn
        ).toBe(true);
  
        expect(
          result.movesFlankPawn
        ).toBe(false);
      });
  
  
      it("detects a central queen pawn move", () => {
        const result =
          getOpeningMoveCharacteristics(
            STARTING_FEN,
            "d2d4"
          );
  
        expect(
          result.movesCentralPawn
        ).toBe(true);
      });
  
  
      it("detects knight development", () => {
        const result =
          getOpeningMoveCharacteristics(
            STARTING_FEN,
            "g1f3"
          );
  
        expect(
          result.developsMinorPiece
        ).toBe(true);
      });
  
  
      it("detects queenside knight development", () => {
        const result =
          getOpeningMoveCharacteristics(
            STARTING_FEN,
            "b1c3"
          );
  
        expect(
          result.developsMinorPiece
        ).toBe(true);
      });
  
  
      it("detects a flank pawn move", () => {
        const result =
          getOpeningMoveCharacteristics(
            STARTING_FEN,
            "h2h3"
          );
  
        expect(
          result.movesFlankPawn
        ).toBe(true);
  
        expect(
          result.movesCentralPawn
        ).toBe(false);
      });
  
  
      it("detects a queen move", () => {
        const fen =
          "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
  
        const result =
          getOpeningMoveCharacteristics(
            fen,
            "d1h5"
          );
  
        expect(
          result.movesQueenEarly
        ).toBe(true);
      });
  
  
      it("detects kingside castling", () => {
        const fen =
          "r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1";
      
        const result =
          getOpeningMoveCharacteristics(
            fen,
            "e8g8"
          );
      
        expect(
          result.castles
        ).toBe(true);
      });
  
  
      it("returns no characteristics for an empty source square", () => {
        const result =
          getOpeningMoveCharacteristics(
            STARTING_FEN,
            "e3e4"
          );
  
        expect(result).toEqual({
          developsMinorPiece: false,
          movesCentralPawn: false,
          castles: false,
          movesQueenEarly: false,
          movesFlankPawn: false,
        });
      });
    }
  );