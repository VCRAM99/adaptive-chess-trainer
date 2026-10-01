import type {
    OpponentCandidate,
  } from "./opponentMove";
  
  
  export type EndgameDecisionImportance =
    | "quiet"
    | "meaningful"
    | "critical"
    | "forcing";
  
  
  export type EndgameDecisionImportanceResult = {
    importance: EndgameDecisionImportance;
    bestLoss: number | null;
    secondBestLoss: number | null;
    gap: number | null;
  };
  
  
  export const MEANINGFUL_ENDGAME_GAP = 20;
  export const CRITICAL_ENDGAME_GAP = 60;
  export const FORCING_ENDGAME_GAP = 120;
  
  
  export function getEndgameDecisionImportance(
    candidates: OpponentCandidate[]
  ): EndgameDecisionImportanceResult {
    if (candidates.length < 2) {
      return {
        importance: "forcing",
        bestLoss:
          candidates[0]?.centipawnLoss ??
          null,
        secondBestLoss: null,
        gap: null,
      };
    }
  
    const sorted =
      [...candidates].sort(
        (a, b) =>
          a.centipawnLoss -
          b.centipawnLoss
      );
  
    const bestLoss =
      sorted[0].centipawnLoss;
  
    const secondBestLoss =
      sorted[1].centipawnLoss;
  
    const gap =
      Math.max(
        0,
        secondBestLoss - bestLoss
      );
  
    if (
      gap >
      FORCING_ENDGAME_GAP
    ) {
      return {
        importance: "forcing",
        bestLoss,
        secondBestLoss,
        gap,
      };
    }
  
    if (
      gap >
      CRITICAL_ENDGAME_GAP
    ) {
      return {
        importance: "critical",
        bestLoss,
        secondBestLoss,
        gap,
      };
    }
  
    if (
      gap >
      MEANINGFUL_ENDGAME_GAP
    ) {
      return {
        importance: "meaningful",
        bestLoss,
        secondBestLoss,
        gap,
      };
    }
  
    return {
      importance: "quiet",
      bestLoss,
      secondBestLoss,
      gap,
    };
  }