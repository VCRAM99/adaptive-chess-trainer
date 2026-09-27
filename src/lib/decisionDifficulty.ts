export type DecisionDifficulty =
  | "forced"
  | "limited"
  | "normal";

export function getDecisionDifficulty(
  legalMoveCount: number
): DecisionDifficulty {
  if (legalMoveCount <= 1) {
    return "forced";
  }

  if (legalMoveCount <= 5) {
    return "limited";
  }

  return "normal";
}