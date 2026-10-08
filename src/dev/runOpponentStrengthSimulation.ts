import type { OpponentCandidate } from "../lib/opponentMove";

import { simulateSkillRange } from "./opponentStrengthSimulator";

const calibrationCandidates: OpponentCandidate[] = [
  {
    rank: 1,
    move: "move-0",
    evaluation: 0,
    centipawnLoss: 0,
    mate: null,
  },
  {
    rank: 2,
    move: "move-10",
    evaluation: -10,
    centipawnLoss: 10,
    mate: null,
  },
  {
    rank: 3,
    move: "move-20",
    evaluation: -20,
    centipawnLoss: 20,
    mate: null,
  },
  {
    rank: 4,
    move: "move-30",
    evaluation: -30,
    centipawnLoss: 30,
    mate: null,
  },
  {
    rank: 5,
    move: "move-40",
    evaluation: -40,
    centipawnLoss: 40,
    mate: null,
  },
  {
    rank: 6,
    move: "move-50",
    evaluation: -50,
    centipawnLoss: 50,
    mate: null,
  },
  {
    rank: 7,
    move: "move-60",
    evaluation: -60,
    centipawnLoss: 60,
    mate: null,
  },
  {
    rank: 8,
    move: "move-70",
    evaluation: -70,
    centipawnLoss: 70,
    mate: null,
  },
  {
    rank: 9,
    move: "move-80",
    evaluation: -80,
    centipawnLoss: 80,
    mate: null,
  },
  {
    rank: 10,
    move: "move-90",
    evaluation: -90,
    centipawnLoss: 90,
    mate: null,
  },
  {
    rank: 11,
    move: "move-100",
    evaluation: -100,
    centipawnLoss: 100,
    mate: null,
  },
  {
    rank: 12,
    move: "move-110",
    evaluation: -110,
    centipawnLoss: 110,
    mate: null,
  },
  {
    rank: 13,
    move: "move-120",
    evaluation: -120,
    centipawnLoss: 120,
    mate: null,
  },
  {
    rank: 14,
    move: "move-130",
    evaluation: -130,
    centipawnLoss: 130,
    mate: null,
  },
  {
    rank: 15,
    move: "move-140",
    evaluation: -140,
    centipawnLoss: 140,
    mate: null,
  },
  {
    rank: 16,
    move: "move-150",
    evaluation: -150,
    centipawnLoss: 150,
    mate: null,
  },
  {
    rank: 17,
    move: "move-160",
    evaluation: -160,
    centipawnLoss: 160,
    mate: null,
  },
  {
    rank: 18,
    move: "move-170",
    evaluation: -170,
    centipawnLoss: 170,
    mate: null,
  },
  {
    rank: 19,
    move: "move-180",
    evaluation: -180,
    centipawnLoss: 180,
    mate: null,
  },
  {
    rank: 20,
    move: "move-190",
    evaluation: -190,
    centipawnLoss: 190,
    mate: null,
  },
];

export function runOpponentStrengthSimulation() {
  const results = simulateSkillRange(calibrationCandidates);

  console.table(
    results.map((result) => ({
      skill: result.targetSkill,

      avgCpl: Number(result.averageCpl.toFixed(1)),

      medianCpl: result.medianCpl,

      excellent: Number(result.excellentPercent.toFixed(1)),

      good: Number(result.goodPercent.toFixed(1)),

      inaccuracy: Number(result.inaccuracyPercent.toFixed(1)),

      mistake: Number(result.mistakePercent.toFixed(1)),

      blunder: Number(result.blunderPercent.toFixed(1)),
    })),
  );

  return results;
}
