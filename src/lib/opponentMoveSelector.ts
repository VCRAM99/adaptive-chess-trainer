import type {
    OpponentCandidate,
} from "./opponentMove";
  
import {
  classifyOpponentMove,
  MIN_OPPONENT_SKILL,
  MAX_OPPONENT_SKILL,
  type OpponentMoveQuality,
} from "./opponentStrength";


const LOW_SKILL_TARGET_CPL = 100;
const HIGH_SKILL_TARGET_CPL = 0;

const LOW_SKILL_CPL_SPREAD = 70;
const HIGH_SKILL_CPL_SPREAD = 25;

function clamp(
  value: number,
  min: number,
  max: number
): number {
  return Math.min(
    max,
    Math.max(min, value)
  );
}

function lerp(
  start: number,
  end: number,
  amount: number
): number {
  return (
    start +
    (end - start) * amount
  );
}

function getSkillProgress(
  targetSkill: number
): number {
  const clampedSkill = clamp(
    targetSkill,
    MIN_OPPONENT_SKILL,
    MAX_OPPONENT_SKILL
  );

  return (
    (clampedSkill -
      MIN_OPPONENT_SKILL) /
    (MAX_OPPONENT_SKILL -
      MIN_OPPONENT_SKILL)
  );
}

export function getTargetCentipawnLoss(
  targetSkill: number
): number {
  return lerp(
    LOW_SKILL_TARGET_CPL,
    HIGH_SKILL_TARGET_CPL,
    getSkillProgress(targetSkill)
  );
}

export function getCentipawnLossSpread(
  targetSkill: number
): number {
  return lerp(
    LOW_SKILL_CPL_SPREAD,
    HIGH_SKILL_CPL_SPREAD,
    getSkillProgress(targetSkill)
  );
}

export function getCentipawnLossWeight(
  centipawnLoss: number,
  targetSkill: number
): number {
  const loss = Math.max(
    0,
    centipawnLoss
  );

  const targetLoss =
    getTargetCentipawnLoss(
      targetSkill
    );

  const spread =
    getCentipawnLossSpread(
      targetSkill
    );

  const distance =
    loss - targetLoss;

  return Math.exp(
    -(
      distance * distance
    ) /
      (
        2 *
        spread *
        spread
      )
  );
}

export type WeightedOpponentCandidate = {
candidate: OpponentCandidate;
quality: OpponentMoveQuality;
weight: number;
};

export function weightOpponentCandidates(
  candidates: OpponentCandidate[],
  targetSkill: number
): WeightedOpponentCandidate[] {
  return candidates.map(
    (candidate) => ({
      candidate,

      quality:
        classifyOpponentMove(
          candidate.centipawnLoss
        ),

      weight:
        getCentipawnLossWeight(
          candidate.centipawnLoss,
          targetSkill
        ),
    })
  );
}

export function selectWeightedOpponentMove(
    weightedCandidates:
      WeightedOpponentCandidate[],
    randomValue = Math.random()
  ): OpponentCandidate | null {
    if (
      weightedCandidates.length === 0
    ) {
      return null;
    }
  
    const totalWeight =
      weightedCandidates.reduce(
        (sum, item) =>
          sum + item.weight,
        0
      );
  
    if (totalWeight <= 0) {
      return (
        weightedCandidates[0]
          .candidate
      );
    }
  
    const normalizedRandom =
      Math.max(
        0,
        Math.min(
          0.999999999,
          randomValue
        )
      );
  
    const target =
      normalizedRandom *
      totalWeight;
  
    let cumulativeWeight = 0;
  
    for (
      const item
      of weightedCandidates
    ) {
      cumulativeWeight +=
        item.weight;
  
      if (
        target <
        cumulativeWeight
      ) {
        return item.candidate;
      }
    }
  
    return (
      weightedCandidates[
        weightedCandidates.length - 1
      ].candidate
    );
  }

  export function chooseOpponentMove(
    candidates: OpponentCandidate[],
    targetSkill: number,
    randomValue = Math.random()
  ): OpponentCandidate | null {
    const weightedCandidates =
      weightOpponentCandidates(
        candidates,
        targetSkill
      );
  
    return selectWeightedOpponentMove(
      weightedCandidates,
      randomValue
    );
  }


  export function getCandidateProbability(
    candidate:
      WeightedOpponentCandidate,
    allCandidates:
      WeightedOpponentCandidate[]
  ): number {
    const totalWeight =
      allCandidates.reduce(
        (sum, item) =>
          sum + item.weight,
        0
      );
  
    if (totalWeight <= 0) {
      return 0;
    }
  
    return (
      candidate.weight /
      totalWeight
    );
  }