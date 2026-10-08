import type { OpponentCandidate } from "../lib/opponentMove";

import { chooseAdaptiveOpponentMove } from "../lib/opponentDecision";

import { classifyOpponentMove } from "../lib/opponentStrength";

import {
  chooseOpponentMoveByDesiredCpl,
  chooseOpponentMoveByContextualDesiredCpl,
  chooseOpponentMoveByFormAdjustedDesiredCpl,
} from "../lib/opponentMoveSelector";

import type { OpponentPositionContext } from "../lib/opponentPositionContext";

export type StrengthSimulationSelector = "current" | "desired-cpl" | "contextual-desired-cpl";

export type StrengthSimulationResult = {
  targetSkill: number;
  samples: number;
  averageCpl: number;
  medianCpl: number;
  minimumCpl: number;
  maximumCpl: number;
  excellentPercent: number;
  goodPercent: number;
  inaccuracyPercent: number;
  mistakePercent: number;
  blunderPercent: number;
};

export function simulateOpponentStrength(
  candidates: OpponentCandidate[],
  targetSkill: number,
  samples = 10_000,
  selector: StrengthSimulationSelector = "current",
  context: OpponentPositionContext = "wide",
): StrengthSimulationResult {
  const selectedCpls: number[] = [];

  const qualityCounts = {
    excellent: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  };

  for (let index = 0; index < samples; index += 1) {
    let selectedCandidate: OpponentCandidate | null;

    if (selector === "contextual-desired-cpl") {
      selectedCandidate = chooseOpponentMoveByContextualDesiredCpl(
        candidates,
        targetSkill,
        context,
      );
    } else if (selector === "desired-cpl") {
      selectedCandidate = chooseOpponentMoveByDesiredCpl(candidates, targetSkill);
    } else {
      selectedCandidate = chooseAdaptiveOpponentMove(candidates, {
        targetSkill,
        opponentForm: 0,
        randomValue1: Math.random(),
        randomValue2: Math.random(),
        tacticalRandomValue: Math.random(),
      }).candidate;
    }

    if (!selectedCandidate) {
      continue;
    }

    const cpl = selectedCandidate.centipawnLoss;

    selectedCpls.push(cpl);

    const quality = classifyOpponentMove(cpl);

    qualityCounts[quality] += 1;
  }

  if (selectedCpls.length === 0) {
    throw new Error("Opponent strength simulation selected no moves.");
  }

  selectedCpls.sort((a, b) => a - b);

  const total = selectedCpls.length;

  const sum = selectedCpls.reduce((currentSum, cpl) => currentSum + cpl, 0);

  const middle = Math.floor(total / 2);

  const medianCpl =
    total % 2 === 0 ? (selectedCpls[middle - 1] + selectedCpls[middle]) / 2 : selectedCpls[middle];

  return {
    targetSkill,

    samples: total,

    averageCpl: sum / total,

    medianCpl,

    minimumCpl: selectedCpls[0],

    maximumCpl: selectedCpls[selectedCpls.length - 1],

    excellentPercent: (qualityCounts.excellent / total) * 100,

    goodPercent: (qualityCounts.good / total) * 100,

    inaccuracyPercent: (qualityCounts.inaccuracy / total) * 100,

    mistakePercent: (qualityCounts.mistake / total) * 100,

    blunderPercent: (qualityCounts.blunder / total) * 100,
  };
}

export const SIMULATION_SKILLS = [400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400];

export function simulateSkillRange(
  candidates: OpponentCandidate[],
  samplesPerSkill = 10_000,
  selector: StrengthSimulationSelector = "current",
  context: OpponentPositionContext = "wide",
) {
  return SIMULATION_SKILLS.map((targetSkill) =>
    simulateOpponentStrength(candidates, targetSkill, samplesPerSkill, selector, context),
  );
}

export function simulateOpponentFormEffect(
  candidates: OpponentCandidate[],
  targetSkill: number,
  context: OpponentPositionContext,
  form: number,
  iterations = 10_000,
) {
  const effectiveSkill = targetSkill;

  const selectedCpls: number[] = [];

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const candidate = chooseOpponentMoveByFormAdjustedDesiredCpl(
      candidates,
      targetSkill,
      context,
      form,
      Math.random(),
      Math.random(),
    );

    if (candidate === null) {
      continue;
    }

    selectedCpls.push(candidate.centipawnLoss);
  }

  if (selectedCpls.length === 0) {
    return {
      targetSkill,
      form,
      effectiveSkill,
      averageCpl: 0,
      medianCpl: 0,
    };
  }

  selectedCpls.sort((a, b) => a - b);

  const totalCpl = selectedCpls.reduce((sum, cpl) => sum + cpl, 0);

  const median = selectedCpls[Math.floor(selectedCpls.length / 2)];

  return {
    targetSkill,
    form,
    effectiveSkill,

    averageCpl: totalCpl / selectedCpls.length,

    medianCpl: median,
  };
}
