import type {
    OpponentCandidate,
} from "./opponentMove";
  
import {
  classifyOpponentMove,
  MIN_OPPONENT_SKILL,
  MAX_OPPONENT_SKILL,
  type OpponentMoveQuality,
} from "./opponentStrength";

import {
  getOpponentErrorScale,
  type OpponentPositionContext,
} from "./opponentPositionContext";

import {
  getOpponentFormCplAdjustment,
} from "./opponentForm";


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

export function sampleStandardNormal(
  randomValue1 = Math.random(),
  randomValue2 = Math.random()
): number {
  // Box-Muller cannot use zero for the first value.
  const u1 = Math.max(
    Number.EPSILON,
    Math.min(1, randomValue1)
  );

  const u2 = Math.max(
    0,
    Math.min(1, randomValue2)
  );

  return (
    Math.sqrt(
      -2 * Math.log(u1)
    ) *
    Math.cos(
      2 * Math.PI * u2
    )
  );
}

export function sampleDesiredCentipawnLoss(
  targetSkill: number,
  randomValue1 = Math.random(),
  randomValue2 = Math.random()
): number {
  const targetLoss =
    getTargetCentipawnLoss(
      targetSkill
    );

  const spread =
    getCentipawnLossSpread(
      targetSkill
    );

  const standardNormal =
    sampleStandardNormal(
      randomValue1,
      randomValue2
    );

  const sampledLoss =
    targetLoss +
    standardNormal * spread;

  return Math.abs(
    sampledLoss
  );
}

export function sampleContextualDesiredCentipawnLoss(
  targetSkill: number,
  context: OpponentPositionContext,
  randomValue1 = Math.random(),
  randomValue2 = Math.random()
): number {
  const errorScale =
    getOpponentErrorScale(context);

    const targetLoss =
    getTargetCentipawnLoss(targetSkill) *
    errorScale;
  
  const spreadScale =
    0.5 + 0.5 * errorScale;
  
  const spread =
    getCentipawnLossSpread(targetSkill) *
    spreadScale;

  const standardNormal =
    sampleStandardNormal(
      randomValue1,
      randomValue2
    );

  const sampledLoss =
    targetLoss +
    standardNormal * spread;

  return Math.abs(sampledLoss);
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

  export function selectCandidateNearestCpl(
    candidates: OpponentCandidate[],
    desiredCpl: number
  ): OpponentCandidate | null {
    if (candidates.length === 0) {
      return null;
    }
  
    let selected =
      candidates[0];
  
    let selectedDistance =
      Math.abs(
        selected.centipawnLoss -
          desiredCpl
      );
  
    for (
      let index = 1;
      index < candidates.length;
      index += 1
    ) {
      const candidate =
        candidates[index];
  
      const distance =
        Math.abs(
          candidate.centipawnLoss -
            desiredCpl
        );
  
      if (distance < selectedDistance) {
        selected = candidate;
        selectedDistance = distance;
      }
    }
  
    return selected;
  }

  export function chooseOpponentMoveByDesiredCpl(
    candidates: OpponentCandidate[],
    targetSkill: number,
    randomValue1 = Math.random(),
    randomValue2 = Math.random()
  ): OpponentCandidate | null {
    if (candidates.length === 0) {
      return null;
    }
  
    if (candidates.length === 1) {
      return candidates[0];
    }
  
    const desiredCpl =
      sampleDesiredCentipawnLoss(
        targetSkill,
        randomValue1,
        randomValue2
      );
  
    return selectCandidateNearestCpl(
      candidates,
      desiredCpl
    );
  }

  export function chooseOpponentMoveByContextualDesiredCpl(
    candidates: OpponentCandidate[],
    targetSkill: number,
    context: OpponentPositionContext,
    randomValue1 = Math.random(),
    randomValue2 = Math.random()
  ): OpponentCandidate | null {
    if (candidates.length === 0) {
      return null;
    }
  
    if (candidates.length === 1) {
      return candidates[0];
    }
  
    const desiredCpl =
      sampleContextualDesiredCentipawnLoss(
        targetSkill,
        context,
        randomValue1,
        randomValue2
      );
  
    return selectCandidateNearestCpl(
      candidates,
      desiredCpl
    );
  }

  export function sampleFormAdjustedDesiredCentipawnLoss(
    targetSkill: number,
    context: OpponentPositionContext,
    form: number,
    randomValue1 = Math.random(),
    randomValue2 = Math.random()
  ): number {
    const baseDesiredLoss =
      sampleContextualDesiredCentipawnLoss(
        targetSkill,
        context,
        randomValue1,
        randomValue2
      );
  
    const formAdjustment =
      getOpponentFormCplAdjustment(
        form
      );
  
    return Math.max(
      0,
      baseDesiredLoss +
        formAdjustment
    );
  }

  export function sampleScaledFormAdjustedDesiredCentipawnLoss(
    targetSkill: number,
    context: OpponentPositionContext,
    opponentForm: number,
    errorScale: number,
    randomValue1 = Math.random(),
    randomValue2 = Math.random()
  ): number {
    const desiredCpl =
      sampleFormAdjustedDesiredCentipawnLoss(
        targetSkill,
        context,
        opponentForm,
        randomValue1,
        randomValue2
      );
  
    const normalizedScale =
      Math.max(0, errorScale);
  
    return desiredCpl * normalizedScale;
  }

  export function chooseOpponentMoveByScaledDesiredCpl(
    candidates: OpponentCandidate[],
    targetSkill: number,
    context: OpponentPositionContext,
    opponentForm: number,
    errorScale: number,
    randomValue1 = Math.random(),
    randomValue2 = Math.random()
  ): OpponentCandidate | null {
    if (candidates.length === 0) {
      return null;
    }
  
    const desiredCpl =
      sampleScaledFormAdjustedDesiredCentipawnLoss(
        targetSkill,
        context,
        opponentForm,
        errorScale,
        randomValue1,
        randomValue2
      );
  
    return selectCandidateNearestCpl(
      candidates,
      desiredCpl
    );
  }

  export function chooseOpponentMoveByFormAdjustedDesiredCpl(
    candidates: OpponentCandidate[],
    targetSkill: number,
    context: OpponentPositionContext,
    form: number,
    randomValue1 = Math.random(),
    randomValue2 = Math.random()
  ): OpponentCandidate | null {
    if (candidates.length === 0) {
      return null;
    }
  
    const desiredLoss =
      sampleFormAdjustedDesiredCentipawnLoss(
        targetSkill,
        context,
        form,
        randomValue1,
        randomValue2
      );
  
    return selectCandidateNearestCpl(
      candidates,
      desiredLoss
    );
  }