import {
  getDecisionDifficulty,
  type DecisionDifficulty,
  type DecisionImportance,
} from "./decisionDifficulty";
import type { MoveAnalysis } from "./moveAnalysis";

export type SkillEvidence =
  "strong_positive" | "positive" | "neutral" | "negative" | "strong_negative";
export const MIN_ESTIMATED_SKILL = 100;
export const MAX_ESTIMATED_SKILL = 3000;

const STRONG_ADJUSTMENT = 8;
const NORMAL_ADJUSTMENT = 4;

export function getSkillEvidence(
  centipawnLoss: number,
  difficulty: DecisionDifficulty,
  importance: DecisionImportance,
): SkillEvidence {
  const loss = Math.max(0, centipawnLoss);

  // Forced moves tell us almost nothing
  // about the player's skill.
  if (difficulty === "forced") return "neutral";

  // Very accurate move.
  if (loss <= 20) {
    if (difficulty === "normal" && importance === "high") return "strong_positive";

    if (difficulty === "normal" && importance === "medium") return "positive";

    return "neutral";
  }

  // Reasonably accurate move.
  if (loss <= 50) {
    if (difficulty === "normal" && importance === "high") return "positive";

    return "neutral";
  }

  // Moderate error.
  if (loss <= 100) {
    if (importance === "high") return "negative";

    return "neutral";
  }

  // Clear mistake.
  if (loss <= 200) {
    if (importance === "high") return "strong_negative";

    return "negative";
  }

  // Large errors are meaningful even when
  // the position itself was not highly critical.
  return "strong_negative";
}

export function updateEstimatedSkill(currentSkill: number, evidence: SkillEvidence): number {
  let adjustment = 0;

  switch (evidence) {
    case "strong_positive":
      adjustment = STRONG_ADJUSTMENT;
      break;

    case "positive":
      adjustment = NORMAL_ADJUSTMENT;
      break;

    case "neutral":
      adjustment = 0;
      break;

    case "negative":
      adjustment = -NORMAL_ADJUSTMENT;
      break;

    case "strong_negative":
      adjustment = -STRONG_ADJUSTMENT;
      break;
  }

  const nextSkill = currentSkill + adjustment;

  return Math.min(MAX_ESTIMATED_SKILL, Math.max(MIN_ESTIMATED_SKILL, nextSkill));
}

export function updateSkillFromMove(
  currentSkill: number,
  centipawnLoss: number,
  difficulty: DecisionDifficulty,
  importance: DecisionImportance,
): number {
  const evidence = getSkillEvidence(centipawnLoss, difficulty, importance);

  return updateEstimatedSkill(currentSkill, evidence);
}

export function updateSkillFromAnalysis(currentSkill: number, analysis: MoveAnalysis): number {
  const difficulty = getDecisionDifficulty(analysis.legalMoveCount);

  return updateSkillFromMove(
    currentSkill,
    analysis.centipawnLoss,
    difficulty,
    analysis.decisionImportance,
  );
}
