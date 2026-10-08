import { describe, expect, it } from "vitest";

import {
  calculateCentipawnLoss,
  evaluationToCentipawns,
  getPlayerPerspectiveEvaluation,
  normalizeToWhitePerspective,
} from "./moveQuality";

describe("move quality", () => {
  it("returns centipawn evaluations directly", () => {
    expect(
      evaluationToCentipawns({
        type: "cp",
        value: 75,
        depth: 12,
      }),
    ).toBe(75);
  });

  it("converts winning mate to a large positive value", () => {
    expect(
      evaluationToCentipawns({
        type: "mate",
        value: 3,
        depth: 12,
      }),
    ).toBe(100000);
  });

  it("converts losing mate to a large negative value", () => {
    expect(
      evaluationToCentipawns({
        type: "mate",
        value: -2,
        depth: 12,
      }),
    ).toBe(-100000);
  });

  it("keeps the score when White is to move", () => {
    expect(
      normalizeToWhitePerspective(
        {
          type: "cp",
          value: 80,
          depth: 12,
        },
        "white",
      ),
    ).toBe(80);
  });

  it("reverses the score when Black is to move", () => {
    expect(
      normalizeToWhitePerspective(
        {
          type: "cp",
          value: 80,
          depth: 12,
        },
        "black",
      ),
    ).toBe(-80);
  });

  it("keeps White evaluation for a White player", () => {
    expect(getPlayerPerspectiveEvaluation(120, "white")).toBe(120);
  });

  it("reverses White evaluation for a Black player", () => {
    expect(getPlayerPerspectiveEvaluation(120, "black")).toBe(-120);
  });

  it("calculates centipawn loss", () => {
    expect(calculateCentipawnLoss(60, -20)).toBe(80);
  });

  it("does not give negative centipawn loss for an improvement", () => {
    expect(calculateCentipawnLoss(40, 60)).toBe(0);
  });

  it("works for a Black player's perspective", () => {
    const beforeWhite = 20;
    const afterWhite = 120;

    const beforePlayer = getPlayerPerspectiveEvaluation(beforeWhite, "black");

    const afterPlayer = getPlayerPerspectiveEvaluation(afterWhite, "black");

    expect(beforePlayer).toBe(-20);
    expect(afterPlayer).toBe(-120);

    expect(calculateCentipawnLoss(beforePlayer, afterPlayer)).toBe(100);
  });
});
