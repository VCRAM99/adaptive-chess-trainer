import type {PlayerColor, } from "./moveQuality";
import {calculateCentipawnLoss,} from "./moveQuality";
  
export type MoveQuality =
| "excellent"
| "good"
| "inaccuracy"
| "mistake"
| "blunder";

export type MoveAnalysis = {
    moveNumber: number;

    playerColor: PlayerColor;

    playerMove: string;
    bestMove: string;

    beforeEvaluation: number;
    afterEvaluation: number;

    legalMoveCount: number;

    centipawnLoss: number;

    quality: MoveQuality;
};

export function classifyMoveQuality(
    centipawnLoss: number
  ): MoveQuality {
    const loss = Math.max(
      0,
      centipawnLoss
    );
  
    if (loss <= 10) {
      return "excellent";
    }
  
    if (loss <= 30) {
      return "good";
    }
  
    if (loss <= 70) {
      return "inaccuracy";
    }
  
    if (loss <= 150) {
      return "mistake";
    }
  
    return "blunder";
}

type CreateMoveAnalysisInput = {
    moveNumber: number;
  
    playerColor: PlayerColor;
  
    playerMove: string;
    bestMove: string;
  
    beforeEvaluation: number;
    afterEvaluation: number;

    legalMoveCount: number;
};
  
export function createMoveAnalysis(
input: CreateMoveAnalysisInput
): MoveAnalysis {
const centipawnLoss =
    calculateCentipawnLoss(
    input.beforeEvaluation,
    input.afterEvaluation
    );

return {
    ...input,

    centipawnLoss,

    quality:
    classifyMoveQuality(
        centipawnLoss
    ),
};
}