import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    classifyOpponentMove,
    getOpponentErrorProfile,
    MIN_OPPONENT_SKILL,
    MAX_OPPONENT_SKILL,
  } from "./opponentStrength";
  
  describe("classifyOpponentMove", () => {
    it("classifies excellent moves", () => {
      expect(
        classifyOpponentMove(0)
      ).toBe("excellent");
  
      expect(
        classifyOpponentMove(10)
      ).toBe("excellent");
    });
  
    it("classifies good moves", () => {
      expect(
        classifyOpponentMove(11)
      ).toBe("good");
  
      expect(
        classifyOpponentMove(30)
      ).toBe("good");
    });
  
    it("classifies inaccuracies", () => {
      expect(
        classifyOpponentMove(31)
      ).toBe("inaccuracy");
  
      expect(
        classifyOpponentMove(80)
      ).toBe("inaccuracy");
    });
  
    it("classifies mistakes", () => {
      expect(
        classifyOpponentMove(81)
      ).toBe("mistake");
  
      expect(
        classifyOpponentMove(180)
      ).toBe("mistake");
    });
  
    it("classifies blunders", () => {
      expect(
        classifyOpponentMove(181)
      ).toBe("blunder");
    });
  
    it("clamps negative loss to zero", () => {
      expect(
        classifyOpponentMove(-50)
      ).toBe("excellent");
    });
  });

  describe("getOpponentErrorProfile", () => {
    it("returns the low-skill profile at the minimum", () => {
      const profile =
        getOpponentErrorProfile(
          MIN_OPPONENT_SKILL
        );
  
      expect(
        profile.targetSkill
      ).toBe(MIN_OPPONENT_SKILL);
  
      expect(
        profile.excellentWeight
      ).toBeCloseTo(30);
  
      expect(
        profile.blunderWeight
      ).toBeCloseTo(5);
    });
  
    it("returns the high-skill profile at the maximum", () => {
      const profile =
        getOpponentErrorProfile(
          MAX_OPPONENT_SKILL
        );
  
      expect(
        profile.targetSkill
      ).toBe(MAX_OPPONENT_SKILL);
  
      expect(
        profile.excellentWeight
      ).toBeCloseTo(82);
  
      expect(
        profile.blunderWeight
      ).toBeCloseTo(0.2);
    });

    it("clamps skill below the supported range", () => {
        const profile =
          getOpponentErrorProfile(100);
      
        expect(
          profile.targetSkill
        ).toBe(MIN_OPPONENT_SKILL);
      });
      
      it("clamps skill above the supported range", () => {
        const profile =
          getOpponentErrorProfile(3000);
      
        expect(
          profile.targetSkill
        ).toBe(MAX_OPPONENT_SKILL);
      });

      it("smoothly increases preference for excellent moves", () => {
        const low =
          getOpponentErrorProfile(800);
      
        const middle =
          getOpponentErrorProfile(1400);
      
        const high =
          getOpponentErrorProfile(2000);
      
        expect(
          low.excellentWeight
        ).toBeLessThan(
          middle.excellentWeight
        );
      
        expect(
          middle.excellentWeight
        ).toBeLessThan(
          high.excellentWeight
        );
      });

      it("smoothly decreases blunder weight", () => {
        const low =
          getOpponentErrorProfile(800);
      
        const middle =
          getOpponentErrorProfile(1400);
      
        const high =
          getOpponentErrorProfile(2000);
      
        expect(
          low.blunderWeight
        ).toBeGreaterThan(
          middle.blunderWeight
        );
      
        expect(
          middle.blunderWeight
        ).toBeGreaterThan(
          high.blunderWeight
        );
      });

      it("keeps total profile weight near 100", () => {
        const ratings = [
          400,
          800,
          1200,
          1600,
          2000,
          2400,
        ];
      
        for (const rating of ratings) {
          const profile =
            getOpponentErrorProfile(
              rating
            );
      
          const total =
            profile.excellentWeight +
            profile.goodWeight +
            profile.inaccuracyWeight +
            profile.mistakeWeight +
            profile.blunderWeight;
      
          expect(total).toBeCloseTo(
            100,
            5
          );
        }
      });
  });