import type {
    OpponentCandidate,
  } from "./opponentMove";
  
  import {
    createSafeOpponentCandidatePool,
  } from "./opponentMoveSafeguards";
  
  import {
    chooseOpponentMoveByContextualDesiredCpl,
  } from "./opponentMoveSelector";

  import {
    getOpponentPositionContext,
  } from "./opponentPositionContext";
  
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
  
    const positionContext =
  getOpponentPositionContext(
    safePool.candidates
  );


return {
  candidate:
    chooseOpponentMoveByContextualDesiredCpl(
      safePool.candidates,
      targetSkill,
      positionContext.context,
      randomValue1,
      randomValue2
    ),

  bypassedSelection: false,
};
  }