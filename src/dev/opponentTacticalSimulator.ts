import type { OpponentCandidate } from "../lib/opponentMove";

import { chooseAdaptiveOpponentMove } from "../lib/opponentDecision";

import { getOpponentTacticalContext } from "../lib/opponentTacticalContext";

import { getTacticalRecognitionProbability } from "../lib/opponentTacticalSkill";

export const TACTICAL_SIMULATION_SKILLS = [400, 800, 1200, 1600, 2000, 2400];

export type TacticalSimulationResult = {
  targetSkill: number;
  context: string;
  recognitionProbability: number;
  trials: number;
  bestMoveRate: number;
  tacticalMoveRate: number;
  averageCpl: number;
};

function candidate(rank: number, centipawnLoss: number, evaluation: number): OpponentCandidate {
  return {
    rank,
    move: `move-${rank}`,
    evaluation,
    centipawnLoss,
    mate: null,
  };
}

/*
 * Synthetic tactical opportunity.
 *
 * One clearly strong tactical move followed
 * by substantially weaker alternatives.
 */
export const TACTICAL_OPPORTUNITY_CANDIDATES = [
  candidate(1, 0, 300),
  candidate(2, 180, 120),
  candidate(3, 220, 80),
  candidate(4, 260, 40),
];

/*
 * Synthetic defensive tactical position.
 *
 * One move avoids a large tactical loss.
 */
export const TACTICAL_DEFENSIVE_CANDIDATES = [
  candidate(1, 0, 20),
  candidate(2, 180, -160),
  candidate(3, 230, -210),
  candidate(4, 280, -260),
];

export function simulateTacticalPosition(
  candidates: OpponentCandidate[],
  targetSkill: number,
  trials = 10_000,
): TacticalSimulationResult {
  const tacticalContext = getOpponentTacticalContext(candidates);

  const recognitionProbability = getTacticalRecognitionProbability(
    targetSkill,
    tacticalContext.context,
  );

  let bestMoveCount = 0;
  let tacticalMoveCount = 0;
  let totalCpl = 0;

  for (let trial = 0; trial < trials; trial += 1) {
    const decision = chooseAdaptiveOpponentMove(candidates, {
      targetSkill,
      opponentForm: 0,
      randomValue1: Math.random(),
      randomValue2: Math.random(),
      tacticalRandomValue: Math.random(),
    });

    const selected = decision.candidate;

    if (!selected) {
      continue;
    }

    if (selected.centipawnLoss === 0) {
      bestMoveCount += 1;
    }

    if (selected.centipawnLoss <= 40) {
      tacticalMoveCount += 1;
    }

    totalCpl += selected.centipawnLoss;
  }

  return {
    targetSkill,
    context: tacticalContext.context,
    recognitionProbability,
    trials,

    bestMoveRate: bestMoveCount / trials,

    tacticalMoveRate: tacticalMoveCount / trials,

    averageCpl: totalCpl / trials,
  };
}

export function runOpponentTacticalSimulation() {
  console.log("\nTACTICAL OPPORTUNITY");

  console.table(
    TACTICAL_SIMULATION_SKILLS.map((skill) =>
      simulateTacticalPosition(TACTICAL_OPPORTUNITY_CANDIDATES, skill),
    ),
  );

  console.log("\nTACTICAL DEFENSE");

  console.table(
    TACTICAL_SIMULATION_SKILLS.map((skill) =>
      simulateTacticalPosition(TACTICAL_DEFENSIVE_CANDIDATES, skill),
    ),
  );
}
