import { Chess } from "chess.js";

export type OpponentGameStage = "non-endgame" | "endgame";

export const ENDGAME_NON_PAWN_MATERIAL_THRESHOLD = 14;

const NON_PAWN_PIECE_VALUES = {
  q: 9,
  r: 5,
  b: 3,
  n: 3,
} as const;

export function getNonPawnMaterial(fen: string): number {
  const game = new Chess(fen);

  let material = 0;

  const board = game.board();

  for (const rank of board) {
    for (const piece of rank) {
      if (!piece) {
        continue;
      }

      if (piece.type === "q" || piece.type === "r" || piece.type === "b" || piece.type === "n") {
        material += NON_PAWN_PIECE_VALUES[piece.type];
      }
    }
  }

  return material;
}

export function getOpponentGameStage(fen: string): OpponentGameStage {
  const nonPawnMaterial = getNonPawnMaterial(fen);

  return nonPawnMaterial <= ENDGAME_NON_PAWN_MATERIAL_THRESHOLD ? "endgame" : "non-endgame";
}

export function isOpponentEndgame(fen: string): boolean {
  return getOpponentGameStage(fen) === "endgame";
}
