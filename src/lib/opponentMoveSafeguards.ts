import type {
    OpponentCandidate,
  } from "./opponentMove";
  
  export const MAX_NORMAL_OPPONENT_LOSS = 300;
  export const MIN_SAFE_CANDIDATE_COUNT = 2;
  
  export type OpponentCandidatePool = {
    candidates: OpponentCandidate[];
    bypassSelection: boolean;
  };

  export function createSafeOpponentCandidatePool(
    candidates: OpponentCandidate[]
  ): OpponentCandidatePool {
    if (candidates.length === 0) {
      return {
        candidates: [],
        bypassSelection: false,
      };
    }
  
    if (candidates.length === 1) {
      return {
        candidates: [candidates[0]],
        bypassSelection: true,
      };
    }

    const winningMates =
      getWinningMateCandidates(
        candidates
      );

      if (winningMates.length > 0) {
        const shortestMate =
          Math.min(
            ...winningMates.map(
              (candidate) =>
                candidate.mate!
            )
          );
      
        return {
          candidates:
            winningMates.filter(
              (candidate) =>
                candidate.mate ===
                shortestMate
            ),
          bypassSelection: true,
        };
      }
  
    const safeCandidates =
      candidates.filter(
        (candidate) =>
          candidate.centipawnLoss <=
          MAX_NORMAL_OPPONENT_LOSS
      );
  
    if (
      safeCandidates.length >=
      MIN_SAFE_CANDIDATE_COUNT
    ) {
      return {
        candidates: safeCandidates,
        bypassSelection: false,
      };
    }
  
    const fallbackCandidates =
      sortByCentipawnLoss(
        candidates
      ).slice(
        0,
        Math.min(
          MIN_SAFE_CANDIDATE_COUNT,
          candidates.length
        )
      );
  
    return {
      candidates: fallbackCandidates,
      bypassSelection: false,
    };
  }


  function sortByCentipawnLoss(
    candidates: OpponentCandidate[]
  ): OpponentCandidate[] {
    return [...candidates].sort(
      (a, b) =>
        a.centipawnLoss -
        b.centipawnLoss
    );
  }

  function getWinningMateCandidates(
    candidates: OpponentCandidate[]
  ): OpponentCandidate[] {
    return candidates.filter(
      (candidate) =>
        candidate.mate !== null &&
        candidate.mate > 0
    );
  }