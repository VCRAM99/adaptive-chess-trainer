import { describe, expect, it } from "vitest";

import { getReviewMoveLabel } from "./reviewMoveLabel";

describe("getReviewMoveLabel", () => {
  it("formats White moves", () => {
    expect(
      getReviewMoveLabel({
        ply: 3,
        san: "Nf3",
        playedBy: "white",
      }),
    ).toBe("2. Nf3");
  });

  it("formats Black moves", () => {
    expect(
      getReviewMoveLabel({
        ply: 4,
        san: "Nc6",
        playedBy: "black",
      }),
    ).toBe("2... Nc6");
  });

  it("formats the first move", () => {
    expect(
      getReviewMoveLabel({
        ply: 1,
        san: "e4",
        playedBy: "white",
      }),
    ).toBe("1. e4");
  });
});
