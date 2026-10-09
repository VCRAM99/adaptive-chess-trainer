import { describe, expect, it } from "vitest";

import type { AnalysisResult } from "../../engine/stockfishAnalysis";

import type { EngineEvaluation } from "../../engine/uciAnalysis";

import { calculateMoveQuality } from "./calculateMoveQuality";

const whiteToMove = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const blackToMove = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1";

function result(evaluation: EngineEvaluation): AnalysisResult {
  return {
    evaluation,
    bestMove: "e2e4",
    candidates: [],
  };
}

function cp(value: number): EngineEvaluation {
  return {
    type: "cp",
    value,
    depth: 12,
  };
}

function mate(value: number): EngineEvaluation {
  return {
    type: "mate",
    value,
    depth: 12,
  };
}

describe("calculateMoveQuality", () => {
  it("labels ordinary evaluations as centipawn", () => {
    const quality = calculateMoveQuality(
      result(cp(100)),
      result(cp(-70)),
      whiteToMove,
      blackToMove,
      "white",
    );

    expect(quality.centipawnLoss).toBe(30);
    expect(quality.qualitySource).toBe("centipawn");
  });

  it("labels forced-mate penalties separately", () => {
    const quality = calculateMoveQuality(
      result(mate(3)),
      result(cp(-100)),
      whiteToMove,
      blackToMove,
      "white",
    );

    expect(quality.centipawnLoss).toBe(500);
    expect(quality.qualitySource).toBe("mate");
  });

  it("marks missing evaluations as unavailable", () => {
    const before: AnalysisResult = {
      evaluation: null,
      bestMove: "",
      candidates: [],
    };

    const quality = calculateMoveQuality(before, result(cp(20)), whiteToMove, blackToMove, "white");

    expect(quality.centipawnLoss).toBeNull();
    expect(quality.qualitySource).toBe("unavailable");
  });
  it("calculates White's centipawn loss", () => {
    const quality = calculateMoveQuality(
      result(cp(120)),
      result(cp(-75)),
      whiteToMove,
      blackToMove,
      "white",
    );

    expect(quality.centipawnLoss).toBe(45);
  });

  it("calculates Black's centipawn loss", () => {
    const quality = calculateMoveQuality(
      result(cp(120)),
      result(cp(-75)),
      blackToMove,
      whiteToMove,
      "black",
    );

    expect(quality.centipawnLoss).toBe(45);
  });

  it("does not penalize preserving a forced mate", () => {
    const quality = calculateMoveQuality(
      result(mate(3)),
      result(mate(-2)),
      whiteToMove,
      blackToMove,
      "white",
    );

    expect(quality.centipawnLoss).toBe(0);
  });

  it("penalizes losing a forced mate", () => {
    const quality = calculateMoveQuality(
      result(mate(3)),
      result(cp(-150)),
      whiteToMove,
      blackToMove,
      "white",
    );

    expect(quality.centipawnLoss).toBe(500);
  });

  it("penalizes introducing a forced loss", () => {
    const quality = calculateMoveQuality(
      result(cp(20)),
      result(mate(2)),
      whiteToMove,
      blackToMove,
      "white",
    );

    expect(quality.centipawnLoss).toBe(500);
  });

  it("does not penalize escaping a forced loss", () => {
    const quality = calculateMoveQuality(
      result(mate(-3)),
      result(cp(50)),
      whiteToMove,
      blackToMove,
      "white",
    );

    expect(quality.centipawnLoss).toBe(0);
  });

  it("returns null when evaluation is missing", () => {
    const before: AnalysisResult = {
      evaluation: null,
      bestMove: "",
      candidates: [],
    };

    const quality = calculateMoveQuality(before, result(cp(20)), whiteToMove, blackToMove, "white");

    expect(quality.centipawnLoss).toBeNull();

    expect(quality.bestMoveUci).toBeNull();
  });
});
