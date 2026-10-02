import type {
    OpeningMoveCharacteristics,
  } from "./opponentOpeningMove";
  
  
  export const MIN_OPENING_SKILL = 400;
  export const MAX_OPENING_SKILL = 2400;
  
  
  /*
   * Maximum opening preference adjustments.
   *
   * Negative adjustment = prefer the move.
   * Positive adjustment = discourage the move.
   *
   * These are bot-design parameters, not claims
   * about human opening accuracy.
   */
  export const DEVELOPMENT_MAX_BONUS = 18;
  export const CENTRAL_PAWN_MAX_BONUS = 14;
  export const CASTLING_MAX_BONUS = 20;
  
  export const EARLY_QUEEN_MAX_PENALTY = 14;
  export const FLANK_PAWN_MAX_PENALTY = 10;
  
  
  export function getOpeningSkillProgress(
    targetSkill: number
  ): number {
    const clampedSkill =
      Math.max(
        MIN_OPENING_SKILL,
        Math.min(
          MAX_OPENING_SKILL,
          targetSkill
        )
      );
  
    return (
      (clampedSkill - MIN_OPENING_SKILL) /
      (MAX_OPENING_SKILL -
        MIN_OPENING_SKILL)
    );
  }
  
  
  export function getOpeningPreferenceAdjustment(
    characteristics:
      OpeningMoveCharacteristics,
    targetSkill: number
  ): number {
    const skillProgress =
      getOpeningSkillProgress(
        targetSkill
      );
  
    /*
     * Even low-skill opponents get a small amount
     * of opening coherence.
     *
     * At 400 skill:
     * multiplier = 0.25
     *
     * At 2400 skill:
     * multiplier = 1.0
     */
    const preferenceStrength =
      0.25 +
      0.75 * skillProgress;
  
    let adjustment = 0;
  
    if (
      characteristics.developsMinorPiece
    ) {
      adjustment -=
        DEVELOPMENT_MAX_BONUS *
        preferenceStrength;
    }
  
    if (
      characteristics.movesCentralPawn
    ) {
      adjustment -=
        CENTRAL_PAWN_MAX_BONUS *
        preferenceStrength;
    }
  
    if (characteristics.castles) {
      adjustment -=
        CASTLING_MAX_BONUS *
        preferenceStrength;
    }
  
    if (
      characteristics.movesQueenEarly
    ) {
      adjustment +=
        EARLY_QUEEN_MAX_PENALTY *
        preferenceStrength;
    }
  
    if (
      characteristics.movesFlankPawn
    ) {
      adjustment +=
        FLANK_PAWN_MAX_PENALTY *
        preferenceStrength;
    }
  
    return adjustment;
  }