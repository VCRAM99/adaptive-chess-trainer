import { Chess } from "chess.js";

import type {
  CompletedGameRecord,
  GameResult,
  GameMoveRecord,
} from "./types";

export function buildGameRecord(
  pgn: string,
  id: string,
  startedAt: string,
  completedAt: string,
  result: GameResult
): CompletedGameRecord {
  const game = new Chess();

  game.loadPgn(pgn);

  const history = game.history({
    verbose: true,
  });

  const replay = new Chess(
    history[0]?.before ?? game.fen()
  );

  const moves: GameMoveRecord[] =
    history.map((move, index) => {
      const fenBefore = replay.fen();

      const playedMove = replay.move(
        move.san
      );

      if (!playedMove) {
        throw new Error(
          `Failed to replay move ${index + 1}`
        );
      }

      return {
        ply: index + 1,
        san: move.san,
        uci:
          move.from +
          move.to +
          (move.promotion ?? ""),
        fenBefore,
        fenAfter: replay.fen(),
        playedBy:
          move.color === "w"
            ? "white"
            : "black",
      };
    });

  return {
    id,
    startedAt,
    completedAt,
    result,
    moves,
  };
}