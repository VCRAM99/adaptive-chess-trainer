export type DecisionDifficulty = "forced" | "limited" | "normal";

export function getDecisionDifficulty(legalMoveCount: number): DecisionDifficulty {
  if (legalMoveCount <= 1) return "forced";

  if (legalMoveCount <= 5) return "limited";

  return "normal";
}

export type DecisionImportance = "low" | "medium" | "high";

export function getDecisionImportance(
  bestEvaluation: number,
  secondBestEvaluation: number,
): DecisionImportance {
  const gap = Math.max(0, bestEvaluation - secondBestEvaluation);

  if (gap <= 20) return "low";

  if (gap <= 80) return "medium";

  return "high";
}
