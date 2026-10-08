import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";

import {
  applyMove,
  copyGame,
  isLegalMove,
  requiresPromotion,
  isUndoAllowed,
  undoLastMove,
  getGameStatus,
  getMoveHistory,
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
    const game = new Chess("4k3/P7/8/8/8/8/8/4K3 w - - 0 1");

    expect(requiresPromotion(game, "a7", "a8")).toBe(true);

    expect(applyMove(game, "a7", "a8")).toBeNull();
  });

  it("promotes a pawn to the selected piece", () => {
    const game = new Chess("4k3/P7/8/8/8/8/8/4K3 w - - 0 1");

    const nextGame = applyMove(game, "a7", "a8", "n");

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
    const game = new Chess("4k3/P7/8/8/8/8/8/4K3 w - - 0 1");

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

  it("shows whose turn it is at the start of a game", () => {
    const game = new Chess();

    expect(getGameStatus(game)).toBe("White to move.");
  });

  it("updates the status after a move", () => {
    const game = new Chess();
    game.move("e4");

    expect(getGameStatus(game)).toBe("Black to move.");
  });

  it("identifies checkmate and the winner", () => {
    const game = new Chess();

    game.move("f3");
    game.move("e5");
    game.move("g4");
    game.move("Qh4#");

    expect(getGameStatus(game)).toBe("Checkmate! Black wins.");
  });

  it("identifies a drawn game", () => {
    const game = new Chess("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");

    expect(getGameStatus(game)).toBe("Game drawn.");
  });

  it("returns an empty move history for a new game", () => {
    const game = new Chess();

    expect(getMoveHistory(game)).toEqual([]);
  });

  it("returns moves in the order they were played", () => {
    const game = new Chess();

    game.move("e4");
    game.move("e5");
    game.move("Nf3");

    expect(getMoveHistory(game)).toEqual(["e4", "e5", "Nf3"]);
  });

  it("updates move history after undo", () => {
    const game = new Chess();

    game.move("e4");
    game.move("e5");

    const previousGame = undoLastMove(game);

    expect(previousGame).not.toBeNull();
    expect(getMoveHistory(previousGame!)).toEqual(["e4"]);
    expect(getMoveHistory(game)).toEqual(["e4", "e5"]);
  });

  it("allows undo during an active game after the player has moved", () => {
    const game = new Chess();
    game.move("e4");

    expect(game.isGameOver()).toBe(false);
    expect(isUndoAllowed(game, "white", false)).toBe(true);
    expect(isUndoAllowed(game, "black", false)).toBe(false);
  });

  it("keeps undo disabled in review mode", () => {
    const game = new Chess();
    game.move("e4");

    expect(isUndoAllowed(game, "white", true)).toBe(false);
  });

  it("disables undo after checkmate", () => {
    const game = new Chess();
    for (const move of ["e4", "e5", "Qh5", "Nc6", "Bc4", "Nf6", "Qxf7"]) {
      game.move(move);
    }

    expect(game.isCheckmate()).toBe(true);
    expect(isUndoAllowed(game, "white", false)).toBe(false);
    expect(isUndoAllowed(game, "black", false)).toBe(false);
  });

  it("disables undo after stalemate", () => {
    const game = new Chess("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");

    expect(game.isStalemate()).toBe(true);
    expect(isUndoAllowed(game, "black", false)).toBe(false);
  });

  it("disables undo after threefold repetition", () => {
    const game = new Chess();
    for (const move of ["Nf3", "Nf6", "Ng1", "Ng8", "Nf3", "Nf6", "Ng1", "Ng8"]) {
      game.move(move);
    }

    expect(game.isThreefoldRepetition()).toBe(true);
    expect(game.isDraw()).toBe(true);
    expect(isUndoAllowed(game, "white", false)).toBe(false);
  });

  it("disables undo when material is insufficient", () => {
    const game = new Chess("8/8/8/8/8/8/k7/K7 w - - 0 1");

    expect(game.isInsufficientMaterial()).toBe(true);
    expect(game.isDraw()).toBe(true);
    expect(isUndoAllowed(game, "white", false)).toBe(false);
  });

  it("disables undo after the fifty-move rule", () => {
    const game = new Chess("8/8/8/8/8/8/k7/K7 w - - 100 80");

    expect(game.isDraw()).toBe(true);
    expect(game.isGameOver()).toBe(true);
    expect(isUndoAllowed(game, "white", false)).toBe(false);
  });
});
