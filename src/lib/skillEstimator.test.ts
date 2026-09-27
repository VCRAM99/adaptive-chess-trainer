import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    getSkillEvidence,
    MAX_ESTIMATED_SKILL,
    MIN_ESTIMATED_SKILL,
    updateEstimatedSkill,
    updateSkillFromMove,
  } from "./skillEstimator";
  
  describe("getSkillEvidence", () => {
    it("returns strong evidence for low centipawn loss", () => {
      expect(
        getSkillEvidence(5)
      ).toBe("strong");
    });
  
    it("returns neutral evidence for moderate centipawn loss", () => {
      expect(
        getSkillEvidence(50)
      ).toBe("neutral");
    });
  
    it("returns weak evidence for high centipawn loss", () => {
      expect(
        getSkillEvidence(150)
      ).toBe("weak");
    });
  
    it("handles exact boundaries", () => {
      expect(
        getSkillEvidence(20)
      ).toBe("strong");
  
      expect(
        getSkillEvidence(21)
      ).toBe("neutral");
  
      expect(
        getSkillEvidence(80)
      ).toBe("neutral");
  
      expect(
        getSkillEvidence(81)
      ).toBe("weak");
    });
  
    it("treats negative loss as zero", () => {
      expect(
        getSkillEvidence(-20)
      ).toBe("strong");
    });
  });
  
  describe("updateEstimatedSkill", () => {
    it("increases skill for strong evidence", () => {
      expect(
        updateEstimatedSkill(
          1200,
          "strong"
        )
      ).toBe(1208);
    });
  
    it("does not change skill for neutral evidence", () => {
      expect(
        updateEstimatedSkill(
          1200,
          "neutral"
        )
      ).toBe(1200);
    });
  
    it("decreases skill for weak evidence", () => {
      expect(
        updateEstimatedSkill(
          1200,
          "weak"
        )
      ).toBe(1192);
    });
  
    it("does not exceed the maximum", () => {
      expect(
        updateEstimatedSkill(
          MAX_ESTIMATED_SKILL,
          "strong"
        )
      ).toBe(MAX_ESTIMATED_SKILL);
    });
  
    it("does not fall below the minimum", () => {
      expect(
        updateEstimatedSkill(
          MIN_ESTIMATED_SKILL,
          "weak"
        )
      ).toBe(MIN_ESTIMATED_SKILL);
    });
  });
  
  describe("updateSkillFromMove", () => {
    it("updates skill from move evidence", () => {
      expect(
        updateSkillFromMove(
          1200,
          10,
          "normal"
        )
      ).toBe(1208);
  
      expect(
        updateSkillFromMove(
          1208,
          50,
          "normal"
        )
      ).toBe(1208);
  
      expect(
        updateSkillFromMove(
          1208,
          120,
          "normal"
        )
      ).toBe(1200);
    });
  
    it("ignores forced moves", () => {
      expect(
        updateSkillFromMove(
          1200,
          0,
          "forced"
        )
      ).toBe(1200);
    });
  
    it("does not reward strong moves with limited choices", () => {
      expect(
        updateSkillFromMove(
          1200,
          5,
          "limited"
        )
      ).toBe(1200);
    });
  
    it("still penalizes a bad move with limited choices", () => {
      expect(
        updateSkillFromMove(
          1200,
          200,
          "limited"
        )
      ).toBe(1192);
    });
  });