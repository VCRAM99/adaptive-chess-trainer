import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    getDecisionDifficulty,
  } from "./decisionDifficulty";
  
  describe("getDecisionDifficulty", () => {
    it("identifies a forced move", () => {
      expect(
        getDecisionDifficulty(1)
      ).toBe("forced");
    });
  
    it("identifies limited choices", () => {
      expect(
        getDecisionDifficulty(3)
      ).toBe("limited");
    });
  
    it("identifies normal choices", () => {
      expect(
        getDecisionDifficulty(20)
      ).toBe("normal");
    });
  
    it("handles the boundaries", () => {
      expect(
        getDecisionDifficulty(5)
      ).toBe("limited");
  
      expect(
        getDecisionDifficulty(6)
      ).toBe("normal");
    });
  });