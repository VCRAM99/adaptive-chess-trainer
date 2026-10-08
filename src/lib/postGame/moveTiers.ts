import type { MoveTier } from "./types";

export const MOVE_TIERS: readonly MoveTier[] = [
  "diamond",
  "platinum",
  "gold",
  "silver",
  "bronze",
  "steel",
  "wood",
];

export function formatTierName(tier: MoveTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
