import type {
    PlayerColor,
    StoredGame,
    StoredGameResult,
    StoredMoveTiers,
  } from "./types";
  
  type CreateStoredGameInput = {
    id: string;
    playedAt: string;
  
    playerColor: PlayerColor;
    trainingMode: StoredGame["trainingMode"];
  
    result: StoredGameResult;
  
    ratingBefore: number;
    ratingAfter: number;
  
    accuracy: number | null;
    averageCentipawnLoss: number | null;
  
    moveCount: number;
    moveTiers: StoredMoveTiers;
  };
  
  export function createStoredGame(
    input: CreateStoredGameInput
  ): StoredGame {
    return {
      id: input.id,
      playedAt: input.playedAt,
  
      playerColor: input.playerColor,
      trainingMode: input.trainingMode,
  
      result: input.result,
  
      ratingBefore: input.ratingBefore,
      ratingAfter: input.ratingAfter,
  
      accuracy: input.accuracy,
      averageCentipawnLoss:
        input.averageCentipawnLoss,
  
      moveCount: input.moveCount,
      moveTiers: input.moveTiers,
    };
  }

  export function getStoredGameResult(
    winner: "white" | "black" | "draw",
    playerColor: PlayerColor
  ): StoredGameResult {
    if (winner === "draw") {
      return "draw";
    }
  
    return winner === playerColor
      ? "win"
      : "loss";
  }