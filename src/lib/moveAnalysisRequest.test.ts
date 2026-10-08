import { describe, expect, it } from "vitest";

import { createMoveAnalysis } from "./moveAnalysis";
import { updateSkillFromAnalysis } from "./skillEstimator";
import {
  createMoveAnalysisRequestId,
  resolveMoveAnalysisUpdate,
  type ExpectedMoveAnalysis,
  type MoveAnalysisDelivery,
} from "./moveAnalysisRequest";

const BEFORE_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AFTER_FEN =
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

function analysis() {
  return createMoveAnalysis({
    moveNumber: 1,
    playerColor: "white",
    playerMove: "e2e4",
    bestMove: "d2d4",
    beforeEvaluation: 80,
    afterEvaluation: -220,
    legalMoveCount: 20,
    decisionImportance: "high",
  });
}

function delivery(
  overrides: Partial<MoveAnalysisDelivery> = {}
): MoveAnalysisDelivery {
  return {
    requestId: createMoveAnalysisRequestId(1, 1),
    gameGeneration: 1,
    beforeFen: BEFORE_FEN,
    afterFen: AFTER_FEN,
    analysis: analysis(),
    ...overrides,
  };
}

function expected(
  overrides: Partial<ExpectedMoveAnalysis> = {}
): ExpectedMoveAnalysis {
  return {
    requestId: createMoveAnalysisRequestId(1, 1),
    gameGeneration: 1,
    beforeFen: BEFORE_FEN,
    afterFen: AFTER_FEN,
    playerColor: "white",
    ...overrides,
  };
}

function resolve(
  overrides: Partial<Parameters<typeof resolveMoveAnalysisUpdate>[0]> = {}
) {
  return resolveMoveAnalysisUpdate({
    delivered: delivery(),
    expected: expected(),
    pendingOpponentFen: AFTER_FEN,
    estimatedRating: 700,
    lastRatedRequestId: null,
    opponentTargetSkill: 640,
    ...overrides,
  });
}

describe("resolveMoveAnalysisUpdate", () => {
  it("accepts analysis for the current request", () => {
    const delivered = delivery();
    const update = resolve({ delivered });

    expect(update.accepted).toBe(true);
    expect(update.acceptedAnalysis).toBe(delivered.analysis);
    expect(update.estimatedRating).toBe(
      updateSkillFromAnalysis(700, delivered.analysis)
    );
    expect(update.opponentTargetSkill).toBe(update.estimatedRating);
    expect(update.estimatedRating).not.toBe(700);
  });

  it("ignores a result that arrives after New Game", () => {
    const update = resolve({
      expected: null,
      pendingOpponentFen: BEFORE_FEN,
      opponentTargetSkill: null,
    });

    expect(update.accepted).toBe(false);
    expect(update.estimatedRating).toBe(700);
    expect(update.opponentTargetSkill).toBeNull();
    expect(update.acceptedAnalysis).toBeNull();
  });

  it("ignores a result that arrives after Undo", () => {
    const update = resolve({
      expected: null,
      pendingOpponentFen: null,
    });

    expect(update.accepted).toBe(false);
    expect(update.estimatedRating).toBe(700);
    expect(update.opponentTargetSkill).toBe(640);
    expect(update.acceptedAnalysis).toBeNull();
  });

  it("ignores an older request that finishes after a newer one", () => {
    const update = resolve({
      delivered: delivery({
        requestId: createMoveAnalysisRequestId(1, 1),
      }),
      expected: expected({
        requestId: createMoveAnalysisRequestId(1, 2),
      }),
    });

    expect(update.accepted).toBe(false);
    expect(update.estimatedRating).toBe(700);
    expect(update.opponentTargetSkill).toBe(640);
  });

  it("ignores a mismatched game generation", () => {
    const update = resolve({
      delivered: delivery({ gameGeneration: 1 }),
      expected: expected({ gameGeneration: 2 }),
    });

    expect(update.accepted).toBe(false);
    expect(update.estimatedRating).toBe(700);
    expect(update.opponentTargetSkill).toBe(640);
    expect(update.acceptedAnalysis).toBeNull();
  });

  it("ignores a mismatched FEN", () => {
    const update = resolve({
      delivered: delivery({ afterFen: AFTER_FEN }),
      pendingOpponentFen: BEFORE_FEN,
    });

    expect(update.accepted).toBe(false);
    expect(update.estimatedRating).toBe(700);
    expect(update.opponentTargetSkill).toBe(640);
  });

  it("does not rate the same request twice", () => {
    const delivered = delivery();
    const update = resolve({
      delivered,
      lastRatedRequestId: delivered.requestId,
    });

    expect(update.accepted).toBe(true);
    expect(update.estimatedRating).toBe(700);
    expect(update.opponentTargetSkill).toBe(700);
  });
});
