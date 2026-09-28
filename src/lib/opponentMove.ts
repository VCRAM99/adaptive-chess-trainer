export type OpponentCandidate = {
    rank: number;
    move: string;
    evaluation: number;
    centipawnLoss: number;
  };

export function calculateCandidateLoss(
    bestEvaluation: number,
    candidateEvaluation: number
): number {
    return Math.max(
        0,
        bestEvaluation - candidateEvaluation
    );
}

type CreateOpponentCandidateInput = {
    rank: number;
    move: string;
    evaluation: number;
    bestEvaluation: number;
};
  
export function createOpponentCandidate(
    input: CreateOpponentCandidateInput
): OpponentCandidate {
    return {
        rank: input.rank,
        move: input.move,
        evaluation: input.evaluation,

        centipawnLoss:
        calculateCandidateLoss(
            input.bestEvaluation,
            input.evaluation
        ),
    };
}

export function filterCandidatesByMaxLoss(
    candidates: OpponentCandidate[],
    maxLoss: number
  ): OpponentCandidate[] {
    if (candidates.length === 0) {
      return [];
    }
  
    const safeMaxLoss =
      Math.max(0, maxLoss);
  
    const filtered =
      candidates.filter(
        (candidate) =>
          candidate.centipawnLoss <=
          safeMaxLoss
      );
  
    if (filtered.length > 0) {
      return filtered;
    }
  
    return [candidates[0]];
}
