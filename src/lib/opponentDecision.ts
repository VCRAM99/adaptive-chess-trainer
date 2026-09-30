import type {
    OpponentCandidate,
  } from "./opponentMove";
  
  import {
    createSafeOpponentCandidatePool,
  } from "./opponentMoveSafeguards";
  
  import {
    chooseOpponentMoveByFormAdjustedDesiredCpl,
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
    opponentForm = 0,
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
    chooseOpponentMoveByFormAdjustedDesiredCpl(
      safePool.candidates,
      targetSkill,
      positionContext.context,
      opponentForm,
      randomValue1,
      randomValue2
    ),

  bypassedSelection: false,
};
  }