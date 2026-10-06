import { Chess } from "chess.js";

export function isForcedMove(
  fenBefore: string
): boolean {
  const game = new Chess(fenBefore);

  return game.moves().length === 1;
}