import { Chess, type PieceSymbol } from "chess.js";

export const CAPTURED_PIECE_ORDER = [
  "q",
  "r",
  "b",
  "n",
  "p",
] as const;

export type CapturedPieceType =
  (typeof CAPTURED_PIECE_ORDER)[number];

export type CapturedPieceCount = {
  type: CapturedPieceType;
  count: number;
};

export type CapturedPiecesByColor = Record<
  "white" | "black",
  CapturedPieceCount[]
>;

type PieceTotals = Record<CapturedPieceType, number>;

function emptyTotals(): PieceTotals {
  return { q: 0, r: 0, b: 0, n: 0, p: 0 };
}

function isCapturedPieceType(
  piece: PieceSymbol
): piece is CapturedPieceType {
  return (
    piece === "q" ||
    piece === "r" ||
    piece === "b" ||
    piece === "n" ||
    piece === "p"
  );
}

function toVisiblePieces(
  totals: PieceTotals
): CapturedPieceCount[] {
  return CAPTURED_PIECE_ORDER.flatMap((type) => {
    const count = totals[type];

    return count > 0 ? [{ type, count }] : [];
  });
}

/**
 * Counts pieces captured by each side from chess.js history.
 * Promotions count as the piece that was actually taken, and
 * a later capture of a promoted piece uses that promoted type.
 */
export function getCapturedPiecesByColor(
  game: Chess
): CapturedPiecesByColor {
  const capturedByWhite = emptyTotals();
  const capturedByBlack = emptyTotals();

  for (const move of game.history({ verbose: true })) {
    if (
      !move.captured ||
      !isCapturedPieceType(move.captured)
    ) {
      continue;
    }

    const totals =
      move.color === "w"
        ? capturedByWhite
        : capturedByBlack;

    totals[move.captured] += 1;
  }

  return {
    white: toVisiblePieces(capturedByWhite),
    black: toVisiblePieces(capturedByBlack),
  };
}

/**
 * Replays SAN moves into a fresh game and counts captures.
 * Used so review navigation follows the displayed history.
 */
export function getCapturedPiecesFromSans(
  sans: readonly string[]
): CapturedPiecesByColor {
  const game = new Chess();

  for (const san of sans) {
    try {
      const played = game.move(san);

      if (!played) {
        break;
      }
    } catch {
      break;
    }
  }

  return getCapturedPiecesByColor(game);
}

export function capturedPieceColor(
  capturer: "white" | "black"
): "w" | "b" {
  return capturer === "white" ? "b" : "w";
}
