import { describe, expect, it } from "vitest";

import { compareReviewMove } from "./reviewMoveComparison";

describe("compareReviewMove", () => {
  it("recognizes the engine best move", () => {
    expect(compareReviewMove("e2e4", "e2e4")).toBe("best");
  });

  it("recognizes a different move", () => {
    expect(compareReviewMove("e2e4", "d2d4")).toBe("different");
  });

  it("handles promotion moves", () => {
    expect(compareReviewMove("e7e8q", "e7e8q")).toBe("best");
  });

  it("ignores casing and surrounding whitespace", () => {
    expect(compareReviewMove(" E7E8Q ", "e7e8q")).toBe("best");
  });

  it("returns unavailable without a best move", () => {
    expect(compareReviewMove("e2e4", null)).toBe("unavailable");
  });
});
