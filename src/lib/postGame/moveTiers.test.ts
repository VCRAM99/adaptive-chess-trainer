import { describe, expect, it } from "vitest";
import type { StoredMoveTiers } from "../profile/types";
import { formatTierName, MOVE_TIERS } from "./moveTiers";

const expectedTiers: (keyof StoredMoveTiers)[] = [
  "diamond",
  "platinum",
  "gold",
  "silver",
  "bronze",
  "steel",
  "wood",
];

describe("MOVE_TIERS", () => {
  it("lists the seven tiers in display order", () => {
    expect(MOVE_TIERS).toEqual(expectedTiers);
  });

  it("matches the StoredMoveTiers keys with no duplicates", () => {
    const storedKeys = Object.keys({
      diamond: 0,
      platinum: 0,
      gold: 0,
      silver: 0,
      bronze: 0,
      steel: 0,
      wood: 0,
    } satisfies StoredMoveTiers);

    expect(new Set(MOVE_TIERS).size).toBe(MOVE_TIERS.length);
    expect([...MOVE_TIERS].sort()).toEqual(storedKeys.sort());
  });
});

describe("formatTierName", () => {
  it("capitalizes each tier identifier", () => {
    expect(MOVE_TIERS.map(formatTierName)).toEqual([
      "Diamond",
      "Platinum",
      "Gold",
      "Silver",
      "Bronze",
      "Steel",
      "Wood",
    ]);
  });
});
