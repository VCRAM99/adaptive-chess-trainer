import { describe, expect, it } from "vitest";
import {
  getStockfishRating,
  getTargetOpponentRating,
  createOpponentConfig,
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
  it("creates an easy opponent configuration", () => {
    expect(
      createOpponentConfig(1500, "easy")
    ).toEqual({
      mode: "easy",
      playerRating: 1500,
      targetRating: 1425,
      stockfishRating: 1425,
    });
  });
  
  it("creates a medium opponent configuration", () => {
    expect(
      createOpponentConfig(1500, "medium")
    ).toEqual({
      mode: "medium",
      playerRating: 1500,
      targetRating: 1500,
      stockfishRating: 1500,
    });
  });
  
  it("creates a hard opponent configuration", () => {
    expect(
      createOpponentConfig(1500, "hard")
    ).toEqual({
      mode: "hard",
      playerRating: 1500,
      targetRating: 1575,
      stockfishRating: 1575,
    });
  });
  
  it("preserves the target when Stockfish must clamp it", () => {
    expect(
      createOpponentConfig(1200, "easy")
    ).toEqual({
      mode: "easy",
      playerRating: 1200,
      targetRating: 1125,
      stockfishRating: 1320,
    });
  });
});