
import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";

import {
  applyMove,
  copyGame,
  isLegalMove,
  requiresPromotion,
  undoLastMove,
} from "./chessGame";

describe("chess game logic", () => {
  it("copies a game without changing the original", () => {
    const original = new Chess();
    original.move("e4");

    const copy = copyGame(original);
    copy.move("e5");

    expect(original.history()).toEqual(["e4"]);
    expect(copy.history()).toEqual(["e4", "e5"]);
  });

  it("accepts a legal opening move", () => {
    const game = new Chess();

    expect(isLegalMove(game, "e2", "e4")).toBe(true);
  });

  it("rejects an illegal opening move", () => {
    const game = new Chess();

    expect(isLegalMove(game, "e2", "e5")).toBe(false);
  });

  it("applies a legal move to a new game", () => {
    const original = new Chess();

    const nextGame = applyMove(original, "e2", "e4");

    expect(nextGame).not.toBeNull();
    expect(nextGame?.get("e4")?.type).toBe("p");
    expect(original.get("e2")?.type).toBe("p");
    expect(original.history()).toEqual([]);
  });

  it("does not apply an illegal move", () => {
    const game = new Chess();

    const result = applyMove(game, "e2", "e5");

    expect(result).toBeNull();
    expect(game.history()).toEqual([]);
  });

  it("detects when a pawn must promote", () => {
    const game = new Chess(
      "4k3/P7/8/8/8/8/8/4K3 w - - 0 1"
    );

    expect(
      requiresPromotion(game, "a7", "a8")
    ).toBe(true);

    expect(
      applyMove(game, "a7", "a8")
    ).toBeNull();
  });

  it("promotes a pawn to the selected piece", () => {
    const game = new Chess(
      "4k3/P7/8/8/8/8/8/4K3 w - - 0 1"
    );

    const nextGame = applyMove(
      game,
      "a7",
      "a8",
      "n"
    );

    expect(nextGame?.get("a8")?.type).toBe("n");
    expect(nextGame?.get("a8")?.color).toBe("w");
    expect(game.get("a7")?.type).toBe("p");
  });
  
  it("undoes the last move without changing the original game", () => {
    const game = new Chess();
    game.move("e4");
    game.move("e5");
  
    const previousGame = undoLastMove(game);
  
    expect(previousGame?.history()).toEqual(["e4"]);
    expect(previousGame?.get("e5")?.type).toBeUndefined();
    expect(previousGame?.get("e7")?.type).toBe("p");
  
    // The original game remains unchanged.
    expect(game.history()).toEqual(["e4", "e5"]);
  });
  
  it("returns null when there are no moves to undo", () => {
    const game = new Chess();
  
    expect(undoLastMove(game)).toBeNull();
  });
  
  it("undoes a move from a custom starting position", () => {
    const game = new Chess(
      "4k3/P7/8/8/8/8/8/4K3 w - - 0 1"
    );
  
    game.move({
      from: "a7",
      to: "a8",
      promotion: "n",
    });
  
    const previousGame = undoLastMove(game);
  
    expect(previousGame?.get("a7")?.type).toBe("p");
    expect(previousGame?.get("a8")).toBeUndefined();
    expect(game.get("a8")?.type).toBe("n");
  });
});