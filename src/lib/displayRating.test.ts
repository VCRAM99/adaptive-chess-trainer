import { describe, expect, it } from "vitest";

import { getDisplayedRating } from "./displayRating";

describe("getDisplayedRating", () => {
  it("subtracts 100 from internal ratings", () => {
    expect(getDisplayedRating(1200)).toBe(1300);
    expect(getDisplayedRating(800)).toBe(900);
    expect(getDisplayedRating(650)).toBe(750);
  });


  it("rounds displayed ratings", () => {
    expect(getDisplayedRating(975.6)).toBe(1076);
  });
});