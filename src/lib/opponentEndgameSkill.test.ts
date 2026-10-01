import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    getEndgameRecognitionProbability,
    getEndgameSkillProgress,
    recognizesEndgameDecision,
  } from "./opponentEndgameSkill";
  
  
  describe(
    "getEndgameSkillProgress",
    () => {
      it(
        "returns zero at 400",
        () => {
          expect(
            getEndgameSkillProgress(400)
          ).toBe(0);
        }
      );
  
  
      it(
        "returns one at 2400",
        () => {
          expect(
            getEndgameSkillProgress(2400)
          ).toBe(1);
        }
      );
  
  
      it(
        "returns 0.5 at 1400",
        () => {
          expect(
            getEndgameSkillProgress(1400)
          ).toBe(0.5);
        }
      );
  
  
      it(
        "clamps below the minimum",
        () => {
          expect(
            getEndgameSkillProgress(100)
          ).toBe(0);
        }
      );
  
  
      it(
        "clamps above the maximum",
        () => {
          expect(
            getEndgameSkillProgress(3000)
          ).toBe(1);
        }
      );
    }
  );
  
  
  describe(
    "getEndgameRecognitionProbability",
    () => {
      it(
        "does not apply recognition to quiet decisions",
        () => {
          expect(
            getEndgameRecognitionProbability(
              400,
              "quiet"
            )
          ).toBe(0);
  
          expect(
            getEndgameRecognitionProbability(
              2400,
              "quiet"
            )
          ).toBe(0);
        }
      );
  
  
      it(
        "increases meaningful recognition with skill",
        () => {
          const low =
            getEndgameRecognitionProbability(
              400,
              "meaningful"
            );
  
          const high =
            getEndgameRecognitionProbability(
              2400,
              "meaningful"
            );
  
          expect(low).toBeCloseTo(0.15);
          expect(high).toBeCloseTo(0.65);
  
          expect(high).toBeGreaterThan(low);
        }
      );
  
  
      it(
        "increases critical recognition with skill",
        () => {
          const low =
            getEndgameRecognitionProbability(
              400,
              "critical"
            );
  
          const high =
            getEndgameRecognitionProbability(
              2400,
              "critical"
            );
  
          expect(low).toBeCloseTo(0.25);
          expect(high).toBeCloseTo(0.85);
  
          expect(high).toBeGreaterThan(low);
        }
      );
  
  
      it(
        "increases forcing recognition with skill",
        () => {
          const low =
            getEndgameRecognitionProbability(
              400,
              "forcing"
            );
  
          const high =
            getEndgameRecognitionProbability(
              2400,
              "forcing"
            );
  
          expect(low).toBeCloseTo(0.35);
          expect(high).toBeCloseTo(0.95);
  
          expect(high).toBeGreaterThan(low);
        }
      );
  
  
      it(
        "recognizes more important decisions more often at the same skill",
        () => {
          const meaningful =
            getEndgameRecognitionProbability(
              1200,
              "meaningful"
            );
  
          const critical =
            getEndgameRecognitionProbability(
              1200,
              "critical"
            );
  
          const forcing =
            getEndgameRecognitionProbability(
              1200,
              "forcing"
            );
  
          expect(critical)
            .toBeGreaterThan(
              meaningful
            );
  
          expect(forcing)
            .toBeGreaterThan(
              critical
            );
        }
      );
    }
  );
  
  
  describe(
    "recognizesEndgameDecision",
    () => {
      it(
        "recognizes when random value is below probability",
        () => {
          expect(
            recognizesEndgameDecision(
              1200,
              "critical",
              0
            )
          ).toBe(true);
        }
      );
  
  
      it(
        "misses when random value is above probability",
        () => {
          expect(
            recognizesEndgameDecision(
              1200,
              "critical",
              0.99
            )
          ).toBe(false);
        }
      );
  
  
      it(
        "never specially recognizes quiet decisions",
        () => {
          expect(
            recognizesEndgameDecision(
              2400,
              "quiet",
              0
            )
          ).toBe(false);
        }
      );
    }
  );