import type {
    OpponentCandidate,
  } from "./opponentMove";
  
  import type {
    EndgameDecisionImportance,
  } from "./opponentEndgameImportance";
  
  
  export const MEANINGFUL_ENDGAME_MAX_CPL = 50;
  export const CRITICAL_ENDGAME_MAX_CPL = 35;
  export const FORCING_ENDGAME_MAX_CPL = 20;
  
  
  export function getRecognizedEndgameMaxCpl(
    importance: EndgameDecisionImportance
  ): number | null {
    switch (importance) {
      case "meaningful":
        return MEANINGFUL_ENDGAME_MAX_CPL;
  
      case "critical":
        return CRITICAL_ENDGAME_MAX_CPL;
  
      case "forcing":
        return FORCING_ENDGAME_MAX_CPL;
  
      case "quiet":
      default:
        return null;
    }
  }
  
  
  export function filterRecognizedEndgameCandidates(
    candidates: OpponentCandidate[],
    importance: EndgameDecisionImportance
  ): OpponentCandidate[] {
    if (candidates.length === 0) {
      return [];
    }
  
    const maxAdditionalLoss =
      getRecognizedEndgameMaxCpl(
        importance
      );
  
    if (maxAdditionalLoss === null) {
      return candidates;
    }
  
    const bestLoss =
      Math.min(
        ...candidates.map(
          (candidate) =>
            candidate.centipawnLoss
        )
      );
  
    const cutoff =
      bestLoss + maxAdditionalLoss;
  
    const filtered =
      candidates.filter(
        (candidate) =>
          candidate.centipawnLoss <=
          cutoff
      );
  
    return filtered.length > 0
      ? filtered
      : candidates;
  }