import type {
    OpponentCandidate,
} from "./opponentMove";
  
import {
classifyOpponentMove,
getOpponentErrorProfile,
type OpponentErrorProfile,
type OpponentMoveQuality,
} from "./opponentStrength";


function getQualityWeight(
quality: OpponentMoveQuality,
profile: OpponentErrorProfile
): number {
switch (quality) {
    case "excellent":
    return profile.excellentWeight;

    case "good":
    return profile.goodWeight;

    case "inaccuracy":
    return profile.inaccuracyWeight;

    case "mistake":
    return profile.mistakeWeight;

    case "blunder":
    return profile.blunderWeight;
}
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
if (candidates.length === 0) {
    return [];
}

const profile =
    getOpponentErrorProfile(
    targetSkill
    );

const classified =
    candidates.map((candidate) => ({
    candidate,
    quality:
        classifyOpponentMove(
        candidate.centipawnLoss
        ),
    }));

const qualityCounts =
    new Map<OpponentMoveQuality, number>();

for (const item of classified) {
    qualityCounts.set(
    item.quality,
    (
        qualityCounts.get(
        item.quality
        ) ?? 0
    ) + 1
    );
}

return classified.map((item) => {
    const categoryWeight =
    getQualityWeight(
        item.quality,
        profile
    );

    const categoryCount =
    qualityCounts.get(
        item.quality
    ) ?? 1;

    return {
    candidate: item.candidate,
    quality: item.quality,
    weight:
        categoryWeight /
        categoryCount,
    };
});
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