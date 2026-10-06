import type { MoveTier } from "./types";

export function classifyMove(
  centipawnLoss: number
): MoveTier {
  if (!Number.isFinite(centipawnLoss)) {
    throw new Error("Invalid centipawn loss");
  }

  const loss = Math.max(0, centipawnLoss);

  if (loss <= 10) return "diamond";
  if (loss <= 25) return "platinum";
  if (loss <= 50) return "gold";
  if (loss <= 90) return "silver";
  if (loss <= 150) return "bronze";
  if (loss <= 250) return "steel";

  return "wood";
}