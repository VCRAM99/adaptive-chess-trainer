import type { CompletedGameRecord } from "./types";

export type PostGameAnalysisPosition = {
  ply: number;
  san: string;
  playedBy: "white" | "black";
  playedMoveUci: string;
  fenBefore: string;
  fenAfter: string;
};

export function createPostGameAnalysisQueue(game: CompletedGameRecord): PostGameAnalysisPosition[] {
  return game.moves.map((move) => ({
    ply: move.ply,
    san: move.san,
    playedBy: move.playedBy,
    playedMoveUci: move.uci,
    fenBefore: move.fenBefore,
    fenAfter: move.fenAfter,
  }));
}
