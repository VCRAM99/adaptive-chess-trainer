import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";

import { undoLastMove } from "./chessGame";
import {
  CAPTURED_PIECE_ORDER,
  capturedPieceColor,
  getCapturedPiecesByColor,
  getCapturedPiecesFromSans,
} from "./capturedPieces";

function play(
  game: Chess,
  sans: string[]
): Chess {
  for (const san of sans) {
    game.move(san);
  }

  return game;
}

describe("captured piece counts", () => {
  it("starts a new game with no captured pieces", () => {
    expect(
      getCapturedPiecesByColor(new Chess())
    ).toEqual({
      white: [],
      black: [],
    });
  });

  it("groups identical captures and keeps a count of one", () => {
    const game = play(new Chess(), [
      "e4",
      "d5",
      "exd5",
      "c6",
      "dxc6",
    ]);

    expect(getCapturedPiecesByColor(game)).toEqual({
      white: [{ type: "p", count: 2 }],
      black: [],
    });
  });

  it("orders piece types queen, rook, bishop, knight, pawn", () => {
    expect(CAPTURED_PIECE_ORDER).toEqual([
      "q",
      "r",
      "b",
      "n",
      "p",
    ]);

    const game = play(
      new Chess("q3k3/8/8/8/8/n7/p7/R3K3 w - - 0 1"),
      ["Rxa2", "Ke7", "Rxa3", "Kd6", "Rxa8"]
    );

    expect(
      getCapturedPiecesByColor(game).white.map(
        (piece) => piece.type
      )
    ).toEqual(["q", "n", "p"]);
  });

  it("counts an en passant capture as a pawn", () => {
    const game = play(
      new Chess(
        "rnbqkbnr/ppp2ppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3"
      ),
      ["exd6"]
    );

    expect(getCapturedPiecesByColor(game).white).toEqual([
      { type: "p", count: 1 },
    ]);
  });

  it("counts the captured piece when a pawn promotes", () => {
    const game = play(
      new Chess("2r1k3/3P4/8/8/8/8/8/4K3 w - - 0 1"),
      ["dxc8=Q"]
    );

    expect(getCapturedPiecesByColor(game)).toEqual({
      white: [{ type: "r", count: 1 }],
      black: [],
    });
  });

  it("counts a captured promoted piece as its promoted type", () => {
    const game = play(
      new Chess("k7/1P6/8/8/8/8/8/4K3 w - - 0 1"),
      ["b8=Q", "Kxb8"]
    );

    expect(getCapturedPiecesByColor(game).black).toEqual([
      { type: "q", count: 1 },
    ]);
  });

  it("removes a capture after undo", () => {
    const game = play(new Chess(), [
      "e4",
      "d5",
      "exd5",
    ]);

    expect(
      getCapturedPiecesByColor(game).white
    ).toEqual([{ type: "p", count: 1 }]);

    const undone = undoLastMove(game);

    expect(undone).not.toBeNull();
    expect(
      getCapturedPiecesByColor(undone as Chess)
    ).toEqual({
      white: [],
      black: [],
    });
  });

  it("replays a prefix of the history for review positions", () => {
    const sans = ["e4", "d5", "exd5", "Qxd5"];

    expect(getCapturedPiecesFromSans(sans)).toEqual({
      white: [{ type: "p", count: 1 }],
      black: [{ type: "p", count: 1 }],
    });

    expect(
      getCapturedPiecesFromSans(sans.slice(0, 3))
    ).toEqual({
      white: [{ type: "p", count: 1 }],
      black: [],
    });

    expect(getCapturedPiecesFromSans([])).toEqual({
      white: [],
      black: [],
    });
  });

  it("shows captured pieces in the opponent's color", () => {
    expect(capturedPieceColor("white")).toBe("b");
    expect(capturedPieceColor("black")).toBe("w");
  });
});
