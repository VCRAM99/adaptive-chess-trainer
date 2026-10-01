import type {
  OpponentCandidate,
} from "./opponentMove";

import {
  createSafeOpponentCandidatePool,
} from "./opponentMoveSafeguards";

import {
  chooseOpponentMoveByFormAdjustedDesiredCpl,
  sampleFormAdjustedDesiredCentipawnLoss,
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
  chooseOpeningAwareCandidate,
} from "./opponentOpeningSelection";

import {
  isOpponentEndgame,
} from "./opponentEndgame";

export type OpponentDecision = {
  candidate: OpponentCandidate | null;
  bypassedSelection: boolean;
};

export type OpponentDecisionOptions = {
  targetSkill: number;
  opponentForm?: number;
  randomValue1?: number;
  randomValue2?: number;
  tacticalRandomValue?: number;
  fen?: string | null;
};

export function chooseAdaptiveOpponentMove(
  candidates: OpponentCandidate[],
  {
    targetSkill,
    opponentForm = 0,
    randomValue1 = Math.random(),
    randomValue2 = Math.random(),
    tacticalRandomValue = Math.random(),
    fen = null,
  }: OpponentDecisionOptions
): OpponentDecision {
  // 1. Apply candidate safeguards.
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

  // 2. Preserve mandatory safeguard bypasses.
  // Examples: single candidate or winning mate.
  if (safePool.bypassSelection) {
    return {
      candidate: safePool.candidates[0],
      bypassedSelection: true,
    };
  }

  // 3. Classify tactical opportunities.
  const tacticalContext =
    getOpponentTacticalContext(
      safePool.candidates
    );

  // 4. Determine whether the bot recognizes
  // the tactical situation.
  const recognizedTactic =
    recognizesTacticalSituation(
      targetSkill,
      tacticalContext.context,
      tacticalRandomValue
    );

  // 5. Apply tactical filtering only when
  // the tactical situation was recognized.
  const selectionCandidates =
    recognizedTactic
      ? getRecognizedTacticalCandidates(
          safePool.candidates
        )
      : safePool.candidates;

  // 6. Determine position context using
  // the actual selection candidate pool.
  const positionContext =
    getOpponentPositionContext(
      selectionCandidates
    );

  // 7. Prevent missed tactics from receiving
  // forced-position accuracy assistance.
  const selectionContext =
    !recognizedTactic &&
    tacticalContext.context !== "normal"
      ? "wide"
      : positionContext.context;

  // 8. Detect endgame positions.
  const endgameActive =
    fen !== null &&
    isOpponentEndgame(fen) &&
    tacticalContext.context === "normal";

  // 9. Determine opening eligibility.
  const fullMoveNumber =
    fen !== null
      ? getFullMoveNumberFromFen(fen)
      : null;

  const useOpeningBehavior =
    fen !== null &&
    fullMoveNumber !== null &&
    !endgameActive &&
    isOpponentOpeningPhase(
      fullMoveNumber
    ) &&
    tacticalContext.context === "normal";

  // 10. Select the final move.
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
        selectionCandidates,
        desiredCpl,
        fen,
        targetSkill
      );
  } else {
    finalCandidate =
      chooseOpponentMoveByFormAdjustedDesiredCpl(
        selectionCandidates,
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