import type {
    OpponentCandidate,
  } from "./opponentMove";
  
  import {
    createSafeOpponentCandidatePool,
  } from "./opponentMoveSafeguards";
  
  import {
    chooseOpponentMove,
  } from "./opponentMoveSelector";
  
  export type OpponentDecision = {
    candidate: OpponentCandidate | null;
    bypassedSelection: boolean;
  };
  
  export function chooseAdaptiveOpponentMove(
    candidates: OpponentCandidate[],
    targetSkill: number,
    randomValue = Math.random()
  ): OpponentDecision {
    const safePool =
      createSafeOpponentCandidatePool(
        candidates
      );
  
    if (safePool.candidates.length === 0) {
      return {
        candidate: null,
        bypassedSelection: false,
      };
    }
  
    if (safePool.bypassSelection) {
      return {
        candidate:
          safePool.candidates[0],
        bypassedSelection: true,
      };
    }
  
    return {
      candidate:
        chooseOpponentMove(
          safePool.candidates,
          targetSkill,
          randomValue
        ),
      bypassedSelection: false,
    };
  }