import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    MAX_DEFENSIVE_RECOGNITION,
    MAX_OPPORTUNITY_RECOGNITION,
    MIN_DEFENSIVE_RECOGNITION,
    MIN_OPPORTUNITY_RECOGNITION,
    getTacticalRecognitionProbability,
    recognizesTacticalSituation,
  } from "./opponentTacticalSkill";
  
  
  describe(
    "getTacticalRecognitionProbability",
    () => {
      it("returns zero for normal positions", () => {
        expect(
          getTacticalRecognitionProbability(
            1200,
            "normal"
          )
        ).toBe(0);
      });
  
  
      it("uses the minimum defensive probability at minimum skill", () => {
        expect(
          getTacticalRecognitionProbability(
            400,
            "defensive"
          )
        ).toBe(
          MIN_DEFENSIVE_RECOGNITION
        );
      });
  
  
      it("uses the maximum defensive probability at maximum skill", () => {
        expect(
          getTacticalRecognitionProbability(
            2400,
            "defensive"
          )
        ).toBe(
          MAX_DEFENSIVE_RECOGNITION
        );
      });
  
  
      it("uses the minimum opportunity probability at minimum skill", () => {
        expect(
          getTacticalRecognitionProbability(
            400,
            "opportunity"
          )
        ).toBe(
          MIN_OPPORTUNITY_RECOGNITION
        );
      });
  
  
      it("uses the maximum opportunity probability at maximum skill", () => {
        expect(
          getTacticalRecognitionProbability(
            2400,
            "opportunity"
          )
        ).toBe(
          MAX_OPPORTUNITY_RECOGNITION
        );
      });
  
  
      it("increases recognition as skill increases", () => {
        const low =
          getTacticalRecognitionProbability(
            800,
            "defensive"
          );
  
        const medium =
          getTacticalRecognitionProbability(
            1400,
            "defensive"
          );
  
        const high =
          getTacticalRecognitionProbability(
            2000,
            "defensive"
          );
  
        expect(medium).toBeGreaterThan(
          low
        );
  
        expect(high).toBeGreaterThan(
          medium
        );
      });
  
  
      it("clamps skill below the supported range", () => {
        expect(
          getTacticalRecognitionProbability(
            100,
            "defensive"
          )
        ).toBe(
          MIN_DEFENSIVE_RECOGNITION
        );
      });
  
  
      it("clamps skill above the supported range", () => {
        expect(
          getTacticalRecognitionProbability(
            3000,
            "opportunity"
          )
        ).toBe(
          MAX_OPPORTUNITY_RECOGNITION
        );
      });
    }
  );
  
  
  describe(
    "recognizesTacticalSituation",
    () => {
      it("never recognizes a normal position as tactical", () => {
        expect(
          recognizesTacticalSituation(
            2400,
            "normal",
            0
          )
        ).toBe(false);
      });
  
  
      it("recognizes a tactical situation when the random value is below the probability", () => {
        const probability =
          getTacticalRecognitionProbability(
            1200,
            "defensive"
          );
  
        expect(
          recognizesTacticalSituation(
            1200,
            "defensive",
            probability - 0.01
          )
        ).toBe(true);
      });
  
  
      it("does not recognize a tactical situation when the random value is above the probability", () => {
        const probability =
          getTacticalRecognitionProbability(
            1200,
            "defensive"
          );
  
        expect(
          recognizesTacticalSituation(
            1200,
            "defensive",
            probability + 0.01
          )
        ).toBe(false);
      });
  
  
      it("uses the probability boundary consistently", () => {
        const probability =
          getTacticalRecognitionProbability(
            1200,
            "opportunity"
          );
  
        expect(
          recognizesTacticalSituation(
            1200,
            "opportunity",
            probability
          )
        ).toBe(false);
      });
  
  
      it("clamps random values below zero", () => {
        expect(
          recognizesTacticalSituation(
            1200,
            "defensive",
            -10
          )
        ).toBe(true);
      });
  
  
      it("clamps random values above one", () => {
        expect(
          recognizesTacticalSituation(
            1200,
            "defensive",
            10
          )
        ).toBe(false);
      });
    }
  );