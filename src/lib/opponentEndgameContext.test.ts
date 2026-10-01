import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    getEndgameRecognitionContextScale,
  } from "./opponentEndgameContext";
  
  
  describe(
    "getEndgameRecognitionContextScale",
    () => {
      it(
        "does not modify quiet decisions",
        () => {
          expect(
            getEndgameRecognitionContextScale(
              "quiet"
            )
          ).toBe(1);
        }
      );
  
  
      it(
        "reduces allowed error as importance increases",
        () => {
          const meaningful =
            getEndgameRecognitionContextScale(
              "meaningful"
            );
  
          const critical =
            getEndgameRecognitionContextScale(
              "critical"
            );
  
          const forcing =
            getEndgameRecognitionContextScale(
              "forcing"
            );
  
          expect(critical)
            .toBeLessThan(meaningful);
  
          expect(forcing)
            .toBeLessThan(critical);
        }
      );
    }
  );