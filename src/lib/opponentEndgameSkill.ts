import type {
    EndgameDecisionImportance,
  } from "./opponentEndgameImportance";
  
  
  export const MIN_ENDGAME_SKILL = 400;
  export const MAX_ENDGAME_SKILL = 2400;
  
  
  export const MIN_MEANINGFUL_ENDGAME_RECOGNITION =
    0.15;
  
  export const MAX_MEANINGFUL_ENDGAME_RECOGNITION =
    0.65;
  
  
  export const MIN_CRITICAL_ENDGAME_RECOGNITION =
    0.25;
  
  export const MAX_CRITICAL_ENDGAME_RECOGNITION =
    0.85;
  
  
  export const MIN_FORCING_ENDGAME_RECOGNITION =
    0.35;
  
  export const MAX_FORCING_ENDGAME_RECOGNITION =
    0.95;
  
  
  function clamp(
    value: number,
    min: number,
    max: number
  ): number {
    return Math.min(
      max,
      Math.max(min, value)
    );
  }
  
  
  export function getEndgameSkillProgress(
    targetSkill: number
  ): number {
    const clampedSkill =
      clamp(
        targetSkill,
        MIN_ENDGAME_SKILL,
        MAX_ENDGAME_SKILL
      );
  
    return (
      (clampedSkill -
        MIN_ENDGAME_SKILL) /
      (MAX_ENDGAME_SKILL -
        MIN_ENDGAME_SKILL)
    );
  }
  
  
  function interpolate(
    min: number,
    max: number,
    progress: number
  ): number {
    return (
      min +
      (max - min) * progress
    );
  }
  
  
  export function getEndgameRecognitionProbability(
    targetSkill: number,
    importance: EndgameDecisionImportance
  ): number {
    if (importance === "quiet") {
      return 0;
    }
  
    const progress =
      getEndgameSkillProgress(
        targetSkill
      );
  
    switch (importance) {
      case "meaningful":
        return interpolate(
          MIN_MEANINGFUL_ENDGAME_RECOGNITION,
          MAX_MEANINGFUL_ENDGAME_RECOGNITION,
          progress
        );
  
      case "critical":
        return interpolate(
          MIN_CRITICAL_ENDGAME_RECOGNITION,
          MAX_CRITICAL_ENDGAME_RECOGNITION,
          progress
        );
  
      case "forcing":
        return interpolate(
          MIN_FORCING_ENDGAME_RECOGNITION,
          MAX_FORCING_ENDGAME_RECOGNITION,
          progress
        );
  
      default:
        return 0;
    }
  }
  
  
  export function recognizesEndgameDecision(
    targetSkill: number,
    importance: EndgameDecisionImportance,
    randomValue = Math.random()
  ): boolean {
    const probability =
      getEndgameRecognitionProbability(
        targetSkill,
        importance
      );
  
    return randomValue < probability;
  }