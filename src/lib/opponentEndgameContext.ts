import type {
    EndgameDecisionImportance,
  } from "./opponentEndgameImportance";
  
  
  export const ENDGAME_RECOGNITION_CONTEXT_SCALE = {
    quiet: 1,
    meaningful: 0.8,
    critical: 0.6,
    forcing: 0.45,
  } as const;
  
  
  export function getEndgameRecognitionContextScale(
    importance: EndgameDecisionImportance
  ): number {
    return ENDGAME_RECOGNITION_CONTEXT_SCALE[
      importance
    ];
  }