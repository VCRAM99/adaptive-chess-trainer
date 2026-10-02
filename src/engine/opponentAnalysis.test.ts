import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    getOpponentMultiPv,
    MAX_OPPONENT_MULTIPV,
  } from "./opponentAnalysis";
  
  describe("getOpponentMultiPv", () => {
    it("uses the legal move count when below the maximum", () => {
      expect(
        getOpponentMultiPv(8)
      ).toBe(8);
  
      expect(
        getOpponentMultiPv(17)
      ).toBe(17);
    });
  
    it("caps MultiPV at the configured maximum", () => {
      expect(
        getOpponentMultiPv(35)
      ).toBe(
        MAX_OPPONENT_MULTIPV
      );
    });
  
    it("never returns less than one", () => {
      expect(
        getOpponentMultiPv(0)
      ).toBe(1);
  
      expect(
        getOpponentMultiPv(-5)
      ).toBe(1);
    });
  
    it("uses a whole-number candidate count", () => {
      expect(
        getOpponentMultiPv(12.9)
      ).toBe(12);
    });
  });