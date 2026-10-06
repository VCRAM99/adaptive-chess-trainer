import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    buildGameRecord,
  } from "./buildGameRecord";
  
  import {
    clampReviewPly,
    getReviewFen,
    getNextReviewPly,
    getPreviousReviewPly,
  } from "./reviewNavigation";
import { Chess } from "chess.js";
  
  const game = buildGameRecord(
    "1. e4 e5 2. Nf3 Nc6",
    "test-game",
    "2026-10-04T12:00:00Z",
    "2026-10-04T12:05:00Z",
    "draw"
  );
  
  describe("reviewNavigation", () => {
    it("clamps positions to valid bounds", () => {
      expect(clampReviewPly(-5, 4)).toBe(0);
      expect(clampReviewPly(10, 4)).toBe(4);
      expect(clampReviewPly(2, 4)).toBe(2);
    });
  
    it("returns the starting position at ply zero", () => {
      expect(getReviewFen(game, 0)).toBe(
        game.moves[0].fenBefore
      );
    });
  
    it("returns the correct position after a move", () => {
      expect(getReviewFen(game, 2)).toBe(
        game.moves[1].fenAfter
      );
    });
  
    it("returns the final position at the end", () => {
      expect(getReviewFen(game, 4)).toBe(
        game.moves[3].fenAfter
      );
    });
  
    it("moves forward and backward", () => {
      expect(getNextReviewPly(2, 4)).toBe(3);
      expect(getPreviousReviewPly(2, 4)).toBe(1);
    });
  
    it("cannot navigate beyond the game", () => {
      expect(getNextReviewPly(4, 4)).toBe(4);
      expect(getPreviousReviewPly(0, 4)).toBe(0);
    });
  
    it("handles games without moves", () => {
      const emptyGame = buildGameRecord(
        "",
        "empty",
        "2026-10-04T12:00:00Z",
        "2026-10-04T12:01:00Z",
        "draw"
      );
  
      expect(getReviewFen(emptyGame, 0)).toBeNull();
    });
    it("returns each move's resulting position", () => {
      const game = buildGameRecord(
        "1. e4 e5 2. Nf3 Nc6",
        "navigation-game",
        "2026-10-05T10:00:00Z",
        "2026-10-05T10:05:00Z",
        "draw"
      );
    
      for (
        let ply = 1;
        ply <= game.moves.length;
        ply += 1
      ) {
        expect(
          getReviewFen(game, ply)
        ).toBe(
          game.moves[ply - 1].fenAfter
        );
      }
    });
    it("returns the final game position for the final ply", () => {
      const game = buildGameRecord(
        "1. f3 e5 2. g4 Qh4#",
        "checkmate-review",
        "2026-10-05T10:00:00Z",
        "2026-10-05T10:05:00Z",
        "black"
      );
    
      const finalPly = game.moves.length;
    
      const reviewFen = getReviewFen(
        game,
        finalPly
      );
      
      expect(reviewFen).not.toBeNull();
      
      if (reviewFen === null) {
        throw new Error(
          "Expected the final review position to exist."
        );
      }
      
      expect(reviewFen).toBe(
        game.moves[finalPly - 1].fenAfter
      );
      
      expect(
        new Chess(reviewFen).isCheckmate()
      ).toBe(true);
    });
    it("returns each move's resulting position", () => {
      const game = buildGameRecord(
        "1. e4 e5 2. Nf3 Nc6",
        "navigation-game",
        "2026-10-05T10:00:00Z",
        "2026-10-05T10:05:00Z",
        "draw"
      );
    
      for (
        let ply = 1;
        ply <= game.moves.length;
        ply += 1
      ) {
        expect(
          getReviewFen(game, ply)
        ).toBe(
          game.moves[ply - 1].fenAfter
        );
      }
    });
  });