import type {
  OpponentCandidate,
} from "./opponentMove";

import {
  createSafeOpponentCandidatePool,
} from "./opponentMoveSafeguards";

import {
  chooseOpponentMoveByFormAdjustedDesiredCpl,
  sampleFormAdjustedDesiredCentipawnLoss,
  //chooseOpponentMoveByScaledDesiredCpl,
} from "./opponentMoveSelector";

import {
  getOpponentPositionContext,
} from "./opponentPositionContext";

import {
  getOpponentTacticalContext,
} from "./opponentTacticalContext";

import {
  recognizesTacticalSituation,
} from "./opponentTacticalSkill";

import {
  getRecognizedTacticalCandidates,
} from "./opponentTacticalSelection";

import {
  getFullMoveNumberFromFen,
  isOpponentOpeningPhase,
} from "./opponentOpening";

import {
  chooseOpeningAwareCandidate
} from "./opponentOpeningSelection";

import {
  isOpponentEndgame,
} from "./opponentEndgame";

// import {
//   getOpponentEndgameType,
// } from "./opponentEndgameType";


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
  tacticalRandomValue = Math.random(),
  fen: string | null = null,
  //endgameRandomValue = Math.random(),

): OpponentDecision {
  const safePool =
    createSafeOpponentCandidatePool(
      candidates
    );

  // No usable candidates.
  if (safePool.candidates.length === 0) {
    return {
      candidate: null,
      bypassedSelection: false,
    };
  }

  /*
   * Preserve safeguard bypasses.
   *
   * This includes cases such as:
   * - only one candidate
   * - winning mate
   *
   * Tactical handling must never override these.
   */
  if (safePool.bypassSelection) {
    return {
      candidate:
        safePool.candidates[0],
      bypassedSelection: true,
    };
  }

  /*
   * Determine whether the safe candidate pool
   * contains a tactically forcing situation.
   */
  const tacticalContext =
    getOpponentTacticalContext(
      safePool.candidates
    );
  /*
   * Tactical recognition is skill-dependent.
   *
   * This random value is deliberately separate
   * from the two values used for desired-CPL
   * sampling.
   */
  const recognizedTactic =
    recognizesTacticalSituation(
      targetSkill,
      tacticalContext.context,
      tacticalRandomValue
    );

  /*
   * If the tactic was recognized, remove moves
   * that fail the tactical requirement.
   *
   * If it was missed, keep the complete safe
   * candidate pool. Missing a tactic does NOT
   * deliberately force a bad move.
   */
  const selectionCandidates =
    recognizedTactic
      ? getRecognizedTacticalCandidates(
          safePool.candidates
        )
      : safePool.candidates;


      const endgameActive =
      fen !== null &&
      isOpponentEndgame(fen) &&
      tacticalContext.context === "normal";
    
    
    // const endgameType =
    //   endgameActive && fen
    //     ? getOpponentEndgameType(fen)
    //     : null;
    
    
      const finalSelectionCandidates =
      selectionCandidates;

  /*
   * Calculate ordinary position context from
   * the candidate pool that will actually be
   * used for selection.
   */
  const positionContext =
    getOpponentPositionContext(
      finalSelectionCandidates
    );

  /*
   * Important interaction between 5.12 and 5.14:
   *
   * If a tactical situation exists but the
   * opponent FAILED to recognize it, we should
   * not also give the opponent the forced/limited
   * accuracy bonus from position context.
   *
   * Otherwise a low-skill opponent can fail the
   * tactical-recognition roll but still find the
   * tactical move almost every time because the
   * position-context system treats the position
   * as highly constrained.
   *
   * "wide" here describes the bot's selection
   * behavior after missing the tactical
   * constraint. It does not claim that the
   * chess position itself is objectively wide.
   */
  const selectionContext =
    !recognizedTactic &&
    tacticalContext.context !== "normal"
      ? "wide"
      : positionContext.context;

      const fullMoveNumber =
      fen
        ? getFullMoveNumberFromFen(
            fen
          )
        : null;
    
        const useOpeningBehavior =
        fen !== null &&
        fullMoveNumber !== null &&
        !endgameActive &&
        isOpponentOpeningPhase(
          fullMoveNumber
        ) &&
        tacticalContext.context ===
          "normal";
    
  /*
   * Final human-like move selection.
   *
   * This still includes:
   * - target skill
   * - position context
   * - temporary opponent form
   * - desired-CPL sampling
   */

  let finalCandidate:
  OpponentCandidate | null;


if (useOpeningBehavior) {
  const desiredCpl =
    sampleFormAdjustedDesiredCentipawnLoss(
      targetSkill,
      selectionContext,
      opponentForm,
      randomValue1,
      randomValue2
    );

  finalCandidate =
    chooseOpeningAwareCandidate(
      finalSelectionCandidates,
      desiredCpl,
      fen,
      targetSkill
    );
}  else {
  finalCandidate =
    chooseOpponentMoveByFormAdjustedDesiredCpl(
      finalSelectionCandidates,
      targetSkill,
      selectionContext,
      opponentForm,
      randomValue1,
      randomValue2
    );
}


return {
  candidate: finalCandidate,
  bypassedSelection: false,
};
}