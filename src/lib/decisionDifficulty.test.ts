import { describe, expect, it } from "vitest";

import { getDecisionDifficulty, getDecisionImportance } from "./decisionDifficulty";

describe("getDecisionDifficulty", () => {
  it("identifies a forced move", () => {
    expect(getDecisionDifficulty(1)).toBe("forced");
  });

  it("identifies limited choices", () => {
    expect(getDecisionDifficulty(3)).toBe("limited");
  });

  it("identifies normal choices", () => {
    expect(getDecisionDifficulty(20)).toBe("normal");
  });

  it("handles the boundaries", () => {
    expect(getDecisionDifficulty(5)).toBe("limited");

    expect(getDecisionDifficulty(6)).toBe("normal");
  });
});

describe("getDecisionImportance", () => {
  it("returns low for similar candidate evaluations", () => {
    expect(getDecisionImportance(35, 30)).toBe("low");
  });

  it("returns medium for a noticeable evaluation gap", () => {
    expect(getDecisionImportance(40, 0)).toBe("medium");
  });

  it("returns high for a large evaluation gap", () => {
    expect(getDecisionImportance(35, -90)).toBe("high");
  });

  it("handles exact boundaries", () => {
    expect(getDecisionImportance(50, 30)).toBe("low");

    expect(getDecisionImportance(50, 29)).toBe("medium");

    expect(getDecisionImportance(100, 20)).toBe("medium");

    expect(getDecisionImportance(100, 19)).toBe("high");
  });

  it("clamps reversed evaluations to zero", () => {
    expect(getDecisionImportance(20, 30)).toBe("low");
  });
});
