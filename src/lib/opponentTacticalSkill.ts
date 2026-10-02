import type {
    OpponentTacticalContext,
  } from "./opponentTacticalContext";
  
  
  export const MIN_TACTICAL_SKILL = 400;
  export const MAX_TACTICAL_SKILL = 2400;
  
  
  /*
   * Provisional bot-design probabilities.
   *
   * These are not claims about real human tactical
   * accuracy at specific Elo ratings.
   */
  export const MIN_DEFENSIVE_RECOGNITION = 0.25;
  export const MAX_DEFENSIVE_RECOGNITION = 0.9;
  
  export const MIN_OPPORTUNITY_RECOGNITION = 0.3;
  export const MAX_OPPORTUNITY_RECOGNITION = 0.95;
  
  
  export function getTacticalRecognitionProbability(
    targetSkill: number,
    context: OpponentTacticalContext
  ): number {
    if (context === "normal") {
      return 0;
    }
  
    const clampedSkill =
      Math.max(
        MIN_TACTICAL_SKILL,
        Math.min(
          MAX_TACTICAL_SKILL,
          targetSkill
        )
      );
  
    const skillProgress =
      (clampedSkill - MIN_TACTICAL_SKILL) /
      (MAX_TACTICAL_SKILL -
        MIN_TACTICAL_SKILL);
  
    if (context === "defensive") {
      return (
        MIN_DEFENSIVE_RECOGNITION +
        skillProgress *
          (
            MAX_DEFENSIVE_RECOGNITION -
            MIN_DEFENSIVE_RECOGNITION
          )
      );
    }
  
    return (
      MIN_OPPORTUNITY_RECOGNITION +
      skillProgress *
        (
          MAX_OPPORTUNITY_RECOGNITION -
          MIN_OPPORTUNITY_RECOGNITION
        )
    );
  }
  
  
  export function recognizesTacticalSituation(
    targetSkill: number,
    context: OpponentTacticalContext,
    randomValue = Math.random()
  ): boolean {
    const probability =
      getTacticalRecognitionProbability(
        targetSkill,
        context
      );
  
    if (probability <= 0) {
      return false;
    }
  
    const normalizedRandom =
      Math.max(
        0,
        Math.min(1, randomValue)
      );
  
    return normalizedRandom < probability;
  }