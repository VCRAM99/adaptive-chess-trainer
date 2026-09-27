import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    classifyMoveQuality,
    createMoveAnalysis,
  } from "./moveAnalysis";
  
describe("classifyMoveQuality", () => {
  it("classifies an excellent move", () => {
    expect(
      classifyMoveQuality(5)
    ).toBe("excellent");
  });

  it("classifies a good move", () => {
    expect(
      classifyMoveQuality(20)
    ).toBe("good");
  });

  it("classifies an inaccuracy", () => {
    expect(
      classifyMoveQuality(50)
    ).toBe("inaccuracy");
  });

  it("classifies a mistake", () => {
    expect(
      classifyMoveQuality(100)
    ).toBe("mistake");
  });

  it("classifies a blunder", () => {
    expect(
      classifyMoveQuality(200)
    ).toBe("blunder");
  });

  it("handles the exact boundaries", () => {
    expect(
      classifyMoveQuality(10)
    ).toBe("excellent");

    expect(
      classifyMoveQuality(30)
    ).toBe("good");

    expect(
      classifyMoveQuality(70)
    ).toBe("inaccuracy");

    expect(
      classifyMoveQuality(150)
    ).toBe("mistake");

    expect(
      classifyMoveQuality(151)
    ).toBe("blunder");
  });

  it("treats negative loss as zero", () => {
    expect(
      classifyMoveQuality(-50)
    ).toBe("excellent");
  });

  describe("createMoveAnalysis", () => {
    it("creates a complete move analysis", () => {
      expect(
        createMoveAnalysis({
          moveNumber: 5,
          playerColor: "white",
          playerMove: "g1f3",
          bestMove: "g1f3",
          beforeEvaluation: 40,
          afterEvaluation: 38,
          legalMoveCount: 25,
        })
      ).toEqual({
        moveNumber: 5,
        playerColor: "white",
        playerMove: "g1f3",
        bestMove: "g1f3",
        beforeEvaluation: 40,
        afterEvaluation: 38,
        legalMoveCount: 25,
        centipawnLoss: 2,
        quality: "excellent",
      });
    });
  
    it("classifies a poor move automatically", () => {
      const result =
        createMoveAnalysis({
          moveNumber: 8,
          playerColor: "black",
          playerMove: "a7a6",
          bestMove: "g8f6",
          beforeEvaluation: 20,
          afterEvaluation: -180,
          legalMoveCount: 18,
        });
  
      expect(
        result.centipawnLoss
      ).toBe(200);
  
      expect(
        result.quality
      ).toBe("blunder");
    });
  });
});