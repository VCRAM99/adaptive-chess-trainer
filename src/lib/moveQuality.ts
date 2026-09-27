import type {
    EngineEvaluation,
  } from "../engine/uciAnalysis";
  
  export type PlayerColor = "white" | "black";
  
  export function evaluationToCentipawns(
    evaluation: EngineEvaluation
  ): number {
    if (evaluation.type === "cp") {
      return evaluation.value;
    }
  
    const mateValue = 100_000;
  
    return evaluation.value > 0
      ? mateValue
      : -mateValue;
  }
  
  export function normalizeToWhitePerspective(
    evaluation: EngineEvaluation,
    sideToMove: PlayerColor
  ): number {
    const centipawns =
      evaluationToCentipawns(evaluation);
  
    return sideToMove === "white"
      ? centipawns
      : -centipawns;
  }
  
  export function getPlayerPerspectiveEvaluation(
    whiteEvaluation: number,
    playerColor: PlayerColor
  ): number {
    return playerColor === "white"
      ? whiteEvaluation
      : -whiteEvaluation;
  }
  
  export function calculateCentipawnLoss(
    beforeEvaluation: number,
    afterEvaluation: number
  ): number {
    return Math.max(
      0,
      beforeEvaluation - afterEvaluation
    );
  }