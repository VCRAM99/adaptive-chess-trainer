import type { Square } from "chess.js";
import type { PromotionPiece } from "../lib/chessGame";

export type UciMove = {
  source: Square;
  target: Square;
  promotion?: PromotionPiece;
};

/**
 * Converts a UCI move such as "e7e8q" into
 * source, target, and optional promotion fields.
 *
 * Returns null for invalid move strings.
 */
export function parseUciMove(
  message: string
): UciMove | null {
  const match = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/.exec(
    message
  );

  if (!match) {
    return null;
  }

  const source = match[1] as Square;
  const target = match[2] as Square;

  if (source === target) {
    return null;
  }

  const promotion = match[3] as
    | PromotionPiece
    | undefined;

  return {
    source,
    target,
    ...(promotion ? { promotion } : {}),
  };
}