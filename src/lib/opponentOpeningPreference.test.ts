import { describe, expect, it } from "vitest";

import type { OpeningMoveCharacteristics } from "./opponentOpeningMove";

import {
  getOpeningPreferenceAdjustment,
  getOpeningSkillProgress,
} from "./opponentOpeningPreference";

function characteristics(
  overrides: Partial<OpeningMoveCharacteristics> = {},
): OpeningMoveCharacteristics {
  return {
    developsMinorPiece: false,
    movesCentralPawn: false,
    castles: false,
    movesQueenEarly: false,
    movesFlankPawn: false,
    ...overrides,
  };
}

describe("getOpeningSkillProgress", () => {
  it("returns zero at minimum skill", () => {
    expect(getOpeningSkillProgress(400)).toBe(0);
  });

  it("returns one at maximum skill", () => {
    expect(getOpeningSkillProgress(2400)).toBe(1);
  });

  it("returns one half at the midpoint", () => {
    expect(getOpeningSkillProgress(1400)).toBe(0.5);
  });

  it("clamps skills below the range", () => {
    expect(getOpeningSkillProgress(100)).toBe(0);
  });

  it("clamps skills above the range", () => {
    expect(getOpeningSkillProgress(3000)).toBe(1);
  });
});

describe("getOpeningPreferenceAdjustment", () => {
  it("returns zero for a neutral move", () => {
    expect(getOpeningPreferenceAdjustment(characteristics(), 1200)).toBe(0);
  });

  it("prefers minor-piece development", () => {
    const adjustment = getOpeningPreferenceAdjustment(
      characteristics({
        developsMinorPiece: true,
      }),
      1200,
    );

    expect(adjustment).toBeLessThan(0);
  });

  it("prefers central pawn moves", () => {
    const adjustment = getOpeningPreferenceAdjustment(
      characteristics({
        movesCentralPawn: true,
      }),
      1200,
    );

    expect(adjustment).toBeLessThan(0);
  });

  it("prefers castling", () => {
    const adjustment = getOpeningPreferenceAdjustment(
      characteristics({
        castles: true,
      }),
      1200,
    );

    expect(adjustment).toBeLessThan(0);
  });

  it("discourages early queen moves", () => {
    const adjustment = getOpeningPreferenceAdjustment(
      characteristics({
        movesQueenEarly: true,
      }),
      1200,
    );

    expect(adjustment).toBeGreaterThan(0);
  });

  it("discourages flank pawn moves", () => {
    const adjustment = getOpeningPreferenceAdjustment(
      characteristics({
        movesFlankPawn: true,
      }),
      1200,
    );

    expect(adjustment).toBeGreaterThan(0);
  });

  it("makes opening preferences stronger at higher skill", () => {
    const move = characteristics({
      developsMinorPiece: true,
    });

    const lowSkill = getOpeningPreferenceAdjustment(move, 400);

    const highSkill = getOpeningPreferenceAdjustment(move, 2400);

    expect(Math.abs(highSkill)).toBeGreaterThan(Math.abs(lowSkill));
  });

  it("combines multiple characteristics", () => {
    const developmentOnly = getOpeningPreferenceAdjustment(
      characteristics({
        developsMinorPiece: true,
      }),
      2400,
    );

    const developmentAndCentral = getOpeningPreferenceAdjustment(
      characteristics({
        developsMinorPiece: true,
        movesCentralPawn: true,
      }),
      2400,
    );

    expect(developmentAndCentral).toBeLessThan(developmentOnly);
  });
});
