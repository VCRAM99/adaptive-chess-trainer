import { describe, expect, it } from "vitest";
import { createReviewArrows } from "./reviewArrows";

describe("createReviewArrows", () => {
  it("creates played and best move arrows", () => {
    expect(createReviewArrows("e2e4", "d2d4")).toEqual([
      {
        from: "e2",
        to: "e4",
        color: "#3b82f6",
      },
      {
        from: "d2",
        to: "d4",
        color: "#22c55e",
      },
    ]);
  });

  it("only creates one arrow when played move is best", () => {
    expect(createReviewArrows("e2e4", "e2e4")).toEqual([
      {
        from: "e2",
        to: "e4",
        color: "#3b82f6",
      },
    ]);
  });

  it("handles missing best move", () => {
    expect(createReviewArrows("e2e4", null)).toEqual([
      {
        from: "e2",
        to: "e4",
        color: "#3b82f6",
      },
    ]);
  });

  it("ignores invalid UCI moves", () => {
    expect(createReviewArrows("", null)).toEqual([]);
  });
});
