import type { AnalyzedMove } from "./types";
import { calculateGameSummary, type GameSummary } from "./gameSummary";

export type PlayerColor = "white" | "black";

export type MatchSummary = {
  player: GameSummary;
  opponent: GameSummary;
};

function getOpponentColor(playerColor: PlayerColor): PlayerColor {
  return playerColor === "white" ? "black" : "white";
}

export function calculateMatchSummary(
  moves: AnalyzedMove[],
  playerColor: PlayerColor,
): MatchSummary {
  const opponentColor = getOpponentColor(playerColor);

  return {
    player: calculateGameSummary(moves, playerColor),

    opponent: calculateGameSummary(moves, opponentColor),
  };
}
