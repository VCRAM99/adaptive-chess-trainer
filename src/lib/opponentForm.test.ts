import {
  describe,
  expect,
  it,
} from "vitest";

import {
  MAX_OPPONENT_FORM,
  MIN_OPPONENT_FORM,
  clampOpponentForm,
  getOpponentFormCplAdjustment,
  updateOpponentForm,
} from "./opponentForm";


describe("clampOpponentForm", () => {
  it("keeps values inside the allowed range", () => {
    expect(
      clampOpponentForm(25)
    ).toBe(25);
  });

  it("clamps values above the maximum", () => {
    expect(
      clampOpponentForm(100)
    ).toBe(MAX_OPPONENT_FORM);
  });

  it("clamps values below the minimum", () => {
    expect(
      clampOpponentForm(-100)
    ).toBe(MIN_OPPONENT_FORM);
  });
});


describe("updateOpponentForm", () => {
  it("increases form with a high random value", () => {
    expect(
      updateOpponentForm(0, 1)
    ).toBe(10);
  });

  it("decreases form with a low random value", () => {
    expect(
      updateOpponentForm(0, 0)
    ).toBe(-10);
  });

  it("applies 5 percent mean reversion with no random change", () => {
    expect(
      updateOpponentForm(20, 0.5)
    ).toBe(19);
  });

  it("pulls positive form toward zero", () => {
    expect(
      updateOpponentForm(50, 0.5)
    ).toBe(47.5);
  });

  it("pulls negative form toward zero", () => {
    expect(
      updateOpponentForm(-50, 0.5)
    ).toBe(-47.5);
  });

  it("does not exceed the maximum form", () => {
    expect(
      updateOpponentForm(
        MAX_OPPONENT_FORM,
        1
      )
    ).toBe(MAX_OPPONENT_FORM);
  });

  it("does not exceed the minimum form", () => {
    expect(
      updateOpponentForm(
        MIN_OPPONENT_FORM,
        0
      )
    ).toBe(MIN_OPPONENT_FORM);
  });

  it("clamps random values above one", () => {
    expect(
      updateOpponentForm(0, 5)
    ).toBe(10);
  });

  it("clamps random values below zero", () => {
    expect(
      updateOpponentForm(0, -5)
    ).toBe(-10);
  });
});


describe("getOpponentFormCplAdjustment", () => {
  it("does not adjust CPL at neutral form", () => {
    expect(
      getOpponentFormCplAdjustment(0)
    ).toBe(0);
  });

  it("increases desired CPL during maximum weak form", () => {
    expect(
      getOpponentFormCplAdjustment(-50)
    ).toBe(20);
  });

  it("decreases desired CPL during maximum strong form", () => {
    expect(
      getOpponentFormCplAdjustment(50)
    ).toBe(-20);
  });

  it("scales weak form continuously", () => {
    expect(
      getOpponentFormCplAdjustment(-25)
    ).toBe(10);
  });

  it("scales strong form continuously", () => {
    expect(
      getOpponentFormCplAdjustment(25)
    ).toBe(-10);
  });

  it("clamps form above the maximum before calculating adjustment", () => {
    expect(
      getOpponentFormCplAdjustment(100)
    ).toBe(-20);
  });

  it("clamps form below the minimum before calculating adjustment", () => {
    expect(
      getOpponentFormCplAdjustment(-100)
    ).toBe(20);
  });
});