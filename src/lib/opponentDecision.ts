import type {
    OpponentCandidate,
  } from "./opponentMove";
  
  import {
    createSafeOpponentCandidatePool,
  } from "./opponentMoveSafeguards";
  
  import {
    chooseOpponentMoveByDesiredCpl,
  } from "./opponentMoveSelector";
  
  export type OpponentDecision = {
    candidate: OpponentCandidate | null;
    bypassedSelection: boolean;
  };
  
  export function chooseAdaptiveOpponentMove(
    candidates: OpponentCandidate[],
    targetSkill: number,
    randomValue1 = Math.random(),
    randomValue2 = Math.random(),
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
        chooseOpponentMoveByDesiredCpl(
          safePool.candidates,
          targetSkill,
          randomValue1,
          randomValue2
        ),
      bypassedSelection: false,
    };
  }