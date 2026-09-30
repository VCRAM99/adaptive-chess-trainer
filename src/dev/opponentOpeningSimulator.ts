import type {
    OpponentCandidate,
  } from "../lib/opponentMove";
  
  import {
    chooseOpponentMoveByFormAdjustedDesiredCpl,
    sampleFormAdjustedDesiredCentipawnLoss,
  } from "../lib/opponentMoveSelector";

  import {
    chooseOpeningAwareCandidate,
  } from "../lib/opponentOpeningSelection";
  
  
  const SKILLS = [
    400,
    800,
    1200,
    1600,
    2000,
    2400,
  ];
  
  const TRIALS = 10_000;
  
  
  /*
   * Synthetic opening position.
   *
   * The exact CPL values are deliberately close enough
   * that opening preferences can influence selection
   * without completely overwhelming objective quality.
   */
  const OPENING_FEN =
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
  
  
  const CANDIDATES: OpponentCandidate[] = [
    {
      rank: 1,
      move: "g1f3",
      evaluation: 20,
      centipawnLoss: 0,
      mate: null,
    },
    {
      rank: 2,
      move: "b1c3",
      evaluation: 14,
      centipawnLoss: 6,
      mate: null,
    },
    {
      rank: 3,
      move: "d2d4",
      evaluation: 8,
      centipawnLoss: 12,
      mate: null,
    },
    {
      rank: 4,
      move: "d2d3",
      evaluation: 0,
      centipawnLoss: 20,
      mate: null,
    },
    {
      rank: 5,
      move: "h2h3",
      evaluation: -8,
      centipawnLoss: 28,
      mate: null,
    },
    {
      rank: 6,
      move: "a2a3",
      evaluation: -14,
      centipawnLoss: 34,
      mate: null,
    },
    {
      rank: 7,
      move: "d1h5",
      evaluation: -22,
      centipawnLoss: 42,
      mate: null,
    },
  ];
  
  
  type SimulationResult = {
    skill: number;
  
    baselineAverageCpl: number;
    openingAverageCpl: number;
  
    baselineCoherentRate: number;
    openingCoherentRate: number;
  
    baselineFlankOrQueenRate: number;
    openingFlankOrQueenRate: number;
  };
  
  
  function isCoherentOpeningMove(
    move: string
  ): boolean {
    return (
      move === "g1f3" ||
      move === "b1c3" ||
      move === "d2d4"
    );
  }
  
  
  function isDiscouragedOpeningMove(
    move: string
  ): boolean {
    return (
      move === "h2h3" ||
      move === "a2a3" ||
      move === "d1h5"
    );
  }
  
  
  export function simulateOpeningBehavior():
    SimulationResult[] {
    return SKILLS.map((skill) => {
      let baselineCpl = 0;
      let openingCpl = 0;
  
      let baselineCoherent = 0;
      let openingCoherent = 0;
  
      let baselineDiscouraged = 0;
      let openingDiscouraged = 0;
  
  
      for (
        let trial = 0;
        trial < TRIALS;
        trial += 1
      ) {
        /*
         * Use the same random samples for both
         * selectors so this is a cleaner A/B
         * comparison.
         */
        const randomValue1 =
          Math.random();
  
        const randomValue2 =
          Math.random();
  
  
        const baselineSelection =
          chooseOpponentMoveByFormAdjustedDesiredCpl(
            CANDIDATES,
            skill,
            "wide",
            0,
            randomValue1,
            randomValue2
          );
  
  
          const desiredCpl =
          sampleFormAdjustedDesiredCentipawnLoss(
            skill,
            "wide",
            0,
            randomValue1,
            randomValue2
          );
        
        const openingSelection =
          chooseOpeningAwareCandidate(
            CANDIDATES,
            desiredCpl,
            OPENING_FEN,
            skill
          );
  
  
        if (baselineSelection) {
          baselineCpl +=
            baselineSelection.centipawnLoss;
  
          if (
            isCoherentOpeningMove(
              baselineSelection.move
            )
          ) {
            baselineCoherent += 1;
          }
  
          if (
            isDiscouragedOpeningMove(
              baselineSelection.move
            )
          ) {
            baselineDiscouraged += 1;
          }
        }
  
  
        if (openingSelection) {
          openingCpl +=
            openingSelection.centipawnLoss;
  
          if (
            isCoherentOpeningMove(
              openingSelection.move
            )
          ) {
            openingCoherent += 1;
          }
  
          if (
            isDiscouragedOpeningMove(
              openingSelection.move
            )
          ) {
            openingDiscouraged += 1;
          }
        }
      }
  
  
      return {
        skill,
  
        baselineAverageCpl:
          baselineCpl / TRIALS,
  
        openingAverageCpl:
          openingCpl / TRIALS,
  
        baselineCoherentRate:
          baselineCoherent / TRIALS,
  
        openingCoherentRate:
          openingCoherent / TRIALS,
  
        baselineFlankOrQueenRate:
          baselineDiscouraged / TRIALS,
  
        openingFlankOrQueenRate:
          openingDiscouraged / TRIALS,
      };
    });
  }
  
  
  export function logOpeningSimulation():
    void {
    const results =
      simulateOpeningBehavior();
  
    console.table(results);
  }