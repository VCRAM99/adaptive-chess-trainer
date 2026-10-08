import type { GameResult } from "./types";

type ChessTurn = "w" | "b";

export function getCheckmateWinner(turn: ChessTurn): GameResult {
  return turn === "w" ? "black" : "white";
}
