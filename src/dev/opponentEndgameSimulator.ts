import type {
    OpponentCandidate,
  } from "../lib/opponentMove";
  
  import {
    getEndgameDecisionImportance,
  } from "../lib/opponentEndgameImportance";
  
  import {
    recognizesEndgameDecision,
  } from "../lib/opponentEndgameSkill";
  
  import {
    getOpponentPositionContext,
  } from "../lib/opponentPositionContext";
  
  import {
    chooseOpponentMoveByFormAdjustedDesiredCpl,
  } from "../lib/opponentMoveSelector";

  import {
    getEndgameRecognitionContextScale,
  } from "../lib/opponentEndgameContext";

  import {
    chooseOpponentMoveByScaledDesiredCpl
  } from "../lib/opponentMoveSelector";
  
  
  const TRIALS = 10_000;
  
  const SKILLS = [
    400,
    800,
    1200,
    1600,
    2000,
    2400,
  ];
  
  
  function candidate(
    rank: number,
    centipawnLoss: number
  ): OpponentCandidate {
    return {
      rank,
      move: `move${rank}`,
      evaluation: 0,
      centipawnLoss,
      mate: null,
    };
  }
  
  
  const ENDGAME_SCENARIOS = {
    quiet: [
      candidate(1, 0),
      candidate(2, 12),
      candidate(3, 18),
      candidate(4, 35),
      candidate(5, 55),
      candidate(6, 80),
    ],
  
    meaningful: [
      candidate(1, 0),
      candidate(2, 35),
      candidate(3, 48),
      candidate(4, 75),
      candidate(5, 110),
      candidate(6, 150),
    ],
  
    critical: [
      candidate(1, 0),
      candidate(2, 90),
      candidate(3, 105),
      candidate(4, 135),
      candidate(5, 175),
      candidate(6, 220),
    ],
  
    forcing: [
      candidate(1, 0),
      candidate(2, 180),
      candidate(3, 200),
      candidate(4, 230),
      candidate(5, 260),
      candidate(6, 290),
    ],
  } satisfies Record<
    string,
    OpponentCandidate[]
  >;
  
  
  type SimulationResult = {
    scenario: string;
    skill: number;
    recognitionRate: number;
    averageCpl: number;
    bestMoveRate: number;
  };
  
  
  function runScenario(
    scenario: string,
    candidates: OpponentCandidate[],
    skill: number
  ): SimulationResult {
    const importance =
      getEndgameDecisionImportance(
        candidates
      );
  
    let recognizedCount = 0;
    let totalCpl = 0;
    let bestMoveCount = 0;
  
    for (
      let trial = 0;
      trial < TRIALS;
      trial += 1
    ) {
      const recognitionRandom =
        Math.random();
  
      const randomValue1 =
        Math.random();
  
      const randomValue2 =
        Math.random();
  
      const recognized =
        recognizesEndgameDecision(
          skill,
          importance.importance,
          recognitionRandom
        );
  
      if (recognized) {
        recognizedCount += 1;
      }
  
      const positionContext =
      getOpponentPositionContext(
        candidates
      );
    
    const errorScale =
      recognized
        ? getEndgameRecognitionContextScale(
            importance.importance
          )
        : 1;
    
    const selected =
      recognized
        ? chooseOpponentMoveByScaledDesiredCpl(
            candidates,
            skill,
            positionContext.context,
            0,
            errorScale,
            randomValue1,
            randomValue2
          )
        : chooseOpponentMoveByFormAdjustedDesiredCpl(
            candidates,
            skill,
            positionContext.context,
            0,
            randomValue1,
            randomValue2
          );
  
      if (!selected) {
        continue;
      }
  
      totalCpl +=
        selected.centipawnLoss;
  
      if (
        selected.centipawnLoss === 0
      ) {
        bestMoveCount += 1;
      }
    }
  
    return {
      scenario,
      skill,
  
      recognitionRate:
        recognizedCount / TRIALS,
  
      averageCpl:
        totalCpl / TRIALS,
  
      bestMoveRate:
        bestMoveCount / TRIALS,
    };
  }
  
  
  export function runEndgameSimulation():
    SimulationResult[] {
    const results:
      SimulationResult[] = [];
  
    for (
      const [
        scenario,
        candidates,
      ] of Object.entries(
        ENDGAME_SCENARIOS
      )
    ) {
      for (const skill of SKILLS) {
        results.push(
          runScenario(
            scenario,
            candidates,
            skill
          )
        );
      }
    }
  
    return results;
  }
  
  
  export function logEndgameSimulation():
    void {
    const results =
      runEndgameSimulation();
  
    console.table(results);
  }