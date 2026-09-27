import type {
  DecisionDifficulty,
} from "./decisionDifficulty";


export type SkillEvidence =
  | "strong"
  | "neutral"
  | "weak";
export const MIN_ESTIMATED_SKILL = 100;
export const MAX_ESTIMATED_SKILL = 3000;

const STRONG_ADJUSTMENT = 8;
const WEAK_ADJUSTMENT = -8;

export function getSkillEvidence(
    centipawnLoss: number
    ): SkillEvidence {
    const loss = Math.max(
        0,
        centipawnLoss
    );

    if (loss <= 20) {
        return "strong";
    }

    if (loss <= 80) {
        return "neutral";
    }

    return "weak";
}

export function updateEstimatedSkill(
    currentSkill: number,
    evidence: SkillEvidence
  ): number {
    let nextSkill = currentSkill;
  
    if (evidence === "strong") {
      nextSkill += STRONG_ADJUSTMENT;
    }
  
    if (evidence === "weak") {
      nextSkill += WEAK_ADJUSTMENT;
    }
  
    return Math.min(
      MAX_ESTIMATED_SKILL,
      Math.max(
        MIN_ESTIMATED_SKILL,
        nextSkill
      )
    );
}

export function updateSkillFromMove(
  currentSkill: number,
  centipawnLoss: number,
  difficulty: DecisionDifficulty
): number {
  const evidence =
    getSkillEvidence(centipawnLoss);

  if (difficulty === "forced") {
    return currentSkill;
  }

  if (difficulty === "limited") {
    if (evidence === "strong") {
      return updateEstimatedSkill(
        currentSkill,
        "neutral"
      );
    }
  }

  return updateEstimatedSkill(
    currentSkill,
    evidence
  );
}