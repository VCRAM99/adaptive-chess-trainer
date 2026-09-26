import { describe, expect, it } from "vitest";

import {
  getTargetOpponentRating,
} from "./trainingDifficulty";

describe("training difficulty", () => {
  it("sets easy 75 points below the player", () => {
    expect(
      getTargetOpponentRating(1200, "easy")
    ).toBe(1125);
  });

  it("matches the player on medium", () => {
    expect(
      getTargetOpponentRating(1200, "medium")
    ).toBe(1200);
  });

  it("sets hard 75 points above the player", () => {
    expect(
      getTargetOpponentRating(1200, "hard")
    ).toBe(1275);
  });

  it("works when the player rating changes", () => {
    expect(
      getTargetOpponentRating(1500, "easy")
    ).toBe(1425);

    expect(
      getTargetOpponentRating(1500, "medium")
    ).toBe(1500);

    expect(
      getTargetOpponentRating(1500, "hard")
    ).toBe(1575);
  });
});