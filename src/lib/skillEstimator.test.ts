import { describe, expect, it } from "vitest";

import {
  getSkillEvidence,
  MAX_ESTIMATED_SKILL,
  MIN_ESTIMATED_SKILL,
  updateEstimatedSkill,
  updateSkillFromMove,
  updateSkillFromAnalysis,
} from "./skillEstimator";

describe("getSkillEvidence", () => {
  it("ignores excellent forced moves", () => {
    expect(getSkillEvidence(0, "forced", "low")).toBe("neutral");
  });

  it("does not reward an excellent low-importance move", () => {
    expect(getSkillEvidence(5, "normal", "low")).toBe("neutral");
  });

  it("gives positive evidence for an excellent medium-importance move", () => {
    expect(getSkillEvidence(5, "normal", "medium")).toBe("positive");
  });

  it("gives strong positive evidence for an excellent critical move", () => {
    expect(getSkillEvidence(5, "normal", "high")).toBe("strong_positive");
  });

  it("gives positive evidence for a reasonably accurate critical move", () => {
    expect(getSkillEvidence(35, "normal", "high")).toBe("positive");
  });

  it("gives negative evidence for a moderate error in a critical position", () => {
    expect(getSkillEvidence(80, "normal", "high")).toBe("negative");
  });

  it("keeps a moderate error neutral in a low-importance position", () => {
    expect(getSkillEvidence(80, "normal", "low")).toBe("neutral");
  });

  it("gives strong negative evidence for a large critical mistake", () => {
    expect(getSkillEvidence(150, "normal", "high")).toBe("strong_negative");
  });

  it("gives negative evidence for a large low-importance mistake", () => {
    expect(getSkillEvidence(150, "normal", "low")).toBe("negative");
  });

  it("gives strong negative evidence for a huge blunder", () => {
    expect(getSkillEvidence(300, "normal", "low")).toBe("strong_negative");
  });

  it("treats negative centipawn loss as zero", () => {
    expect(getSkillEvidence(-20, "normal", "high")).toBe("strong_positive");
  });
});

describe("updateEstimatedSkill", () => {
  it("applies strong positive evidence", () => {
    expect(updateEstimatedSkill(1200, "strong_positive")).toBe(1208);
  });

  it("applies positive evidence", () => {
    expect(updateEstimatedSkill(1200, "positive")).toBe(1204);
  });

  it("does not change skill for neutral evidence", () => {
    expect(updateEstimatedSkill(1200, "neutral")).toBe(1200);
  });

  it("applies negative evidence", () => {
    expect(updateEstimatedSkill(1200, "negative")).toBe(1196);
  });

  it("applies strong negative evidence", () => {
    expect(updateEstimatedSkill(1200, "strong_negative")).toBe(1192);
  });

  it("does not exceed the maximum", () => {
    expect(updateEstimatedSkill(MAX_ESTIMATED_SKILL, "strong_positive")).toBe(MAX_ESTIMATED_SKILL);
  });

  it("does not fall below the minimum", () => {
    expect(updateEstimatedSkill(MIN_ESTIMATED_SKILL, "strong_negative")).toBe(MIN_ESTIMATED_SKILL);
  });
});

describe("updateSkillFromMove", () => {
  it("combines move accuracy and decision context", () => {
    expect(updateSkillFromMove(1200, 5, "normal", "high")).toBe(1208);

    expect(updateSkillFromMove(1208, 5, "normal", "low")).toBe(1208);

    expect(updateSkillFromMove(1208, 150, "normal", "high")).toBe(1200);
  });

  it("does not reward a forced move", () => {
    expect(updateSkillFromMove(1200, 0, "forced", "low")).toBe(1200);
  });
});

describe("updateSkillFromAnalysis", () => {
  it("updates skill from a complete move analysis", () => {
    const result = updateSkillFromAnalysis(1200, {
      moveNumber: 8,
      playerColor: "white",
      playerMove: "f3e5",
      bestMove: "f3e5",

      beforeEvaluation: 25,
      afterEvaluation: 20,

      legalMoveCount: 24,
      decisionImportance: "high",

      centipawnLoss: 5,
      quality: "excellent",
    });

    expect(result).toBe(1208);
  });

  it("ignores an excellent forced move", () => {
    const result = updateSkillFromAnalysis(1200, {
      moveNumber: 15,
      playerColor: "white",
      playerMove: "g1h1",
      bestMove: "g1h1",

      beforeEvaluation: -20,
      afterEvaluation: -20,

      legalMoveCount: 1,
      decisionImportance: "low",

      centipawnLoss: 0,
      quality: "excellent",
    });

    expect(result).toBe(1200);
  });
});
