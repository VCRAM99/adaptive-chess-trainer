import { describe, expect, it } from "vitest";
import {
  getStockfishRating,
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

  it("clamps ratings below Stockfish's minimum", () => {
    expect(getStockfishRating(1125)).toBe(1320);
  });
  
  it("keeps supported ratings unchanged", () => {
    expect(getStockfishRating(1500)).toBe(1500);
  });
  
  it("clamps ratings above Stockfish's maximum", () => {
    expect(getStockfishRating(4000)).toBe(3190);
  });
});